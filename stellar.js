var SorobanClient = require('soroban-client');
var server = new SorobanClient.Server('https://rpc-futurenet.stellar.org:443/');

// get the sequence number for an account
server.getAccount(
  'GASOCNHNNLYFNMDJYQ3XFMI7BYHIOCFW3GJEOWRPEGK2TDPGTG2E5EDW'
).then(function(r){ console.log(r); });