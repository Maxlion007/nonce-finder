const Web3 = require('web3');

var provider_address="http://127.0.0.1:8545";

var address ='0x9dDc772bbFd702D2A1E246Cd6dd26a312F15eef7';

var web3 = new Web3(new Web3.providers.HttpProvider(provider_address));

 web3.eth.extend({
  property: 'txpool',
  methods: [{
    name: 'content',
    call: 'txpool_content'
  },{
    name: 'inspect',
    call: 'txpool_inspect'
  },{
    name: 'status',
    call: 'txpool_status'
  }]
});

getData(address).then((result)=>
  {
    console.log('All nonces: '+result.nonces);

    console.log('Next nonce: '+ result.nextNonce);

    console.log('Pending tx: ');
    console.log(result.tx.pending);

    console.log('Queued tx: ');
    console.log(result.tx.queued);
  });

async function getData(address)
{
  var result = await getNonces(address);

  for(var i = Math.min(...result.nonces); i<=Math.max(...result.nonces);i++)
  {
    if(!result.nonces.includes(i+1))
    {
      result.nextNonce=i+1;
      break;
    }
  }
  return result;
}

function getNonces(address)
{
  return new Promise((resolve,reject)=>
  {
  var result={nonces:[],nextNonce:undefined,tx:{pending:{},queued:{}}};
  getAccountNonce(address,result)
    .then(
      result => {
        // console.log(result);
        getPendingAccountNonce(address,result).then(
          result=>{
            // console.log(result);
            getTxNonces(address,result).then(
              result=>{
                // console.log(result);
                resolve(result);
              },
              error=>{
                console.error(error)
              });
          },
          error=>{
          console.log("Rejected: " + error);
          })
      },
      error => {
        console.log("Rejected: " + error);
      }
    );    
  })
}

function getAccountNonce(address,result)
{
return new Promise((resolve, reject)=>
  {
    web3.eth.getTransactionCount(address).then(nonce=>
      {
        result.nonces.push(nonce-1);
        resolve(result);
      });
  });
}

function getPendingAccountNonce(address,result)
{
  return new Promise((resolve, reject)=>
    {
      web3.eth.getTransactionCount(address,'pending').then(nonce=>
        {
          result.nonces.push(nonce-1);
          resolve(result);
        });
    });
}

function getTxNonces(address,result)
{
  return new Promise((resolve,reject)=>
  {
    try
    {
        web3.eth.txpool.content().then(function(txpool){

          if(txpool.pending[address])
          {
            result.tx.pending=txpool.pending[address];            
          }

          if(txpool.queued[address])
          {
            result.tx.queued=txpool.queued[address];
              for(var queued_nonce in result.tx.queued[address])
              {
                 result.nonces.push(parseInt(queued_nonce));
              }
          }
          resolve(result);
        }).catch(
        function(e){console.log(e);}
        // console.log('Could not access txpool');
      ).then(function(){
        console.log('Could not connect to txpool');
        resolve(result);

      })
    }catch(e)
    {
        console.log(e);
        resolve(result);
    }
  });
}
