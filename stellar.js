var SorobanClient = require('soroban-client');
var server = new SorobanClient.Server('https://rpc-futurenet.stellar.org:443/');

// get the sequence number for an account
server.getAccount(
  'GC4MEJJJMNIBIDZSJOZOPVUQQUKR3AARFLPFYKUFXU2D7PHWJP5S4AEI'
).then(function(r){ console.log(r); });

// Construct the LedgerKey we want to look up
const key = SorobanClient.xdr.LedgerKey.account(
  new SorobanClient.xdr.LedgerKeyAccount({
    accountId: 'GC4MEJJJMNIBIDZSJOZOPVUQQUKR3AARFLPFYKUFXU2D7PHWJP5S4AEI'
  })
);

// Fetch the current LedgerKeyData from the server.
server.getLedgerEntry(key).then(function (response) {
  const parsed = SorobanClient.xdr.LedgerEntryData.fromXDR(response.xdr, 'base64');
  console.log( JSON.stringify(parsed) );
});