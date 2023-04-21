var SorobanClient = require("soroban-client");
var server = new SorobanClient.Server("https://rpc-futurenet.stellar.org:443/");

// Issuer
const issuerKeyPair = SorobanClient.Keypair.random();
const issuerSecretKey = issuerKeyPair.secret();
const issuerPublicKey = issuerKeyPair.publicKey();

// Distributor
const distributorKeyPair = SorobanClient.Keypair.random();
const distributorSecretKey = distributorKeyPair.secret();
const distributorPublicKey = distributorKeyPair.publicKey();

console.log(issuerSecretKey);
console.log(issuerPublicKey);

console.log(distributorSecretKey);
console.log(distributorPublicKey);

// Create an object to represent the new asset
var eduCert = new SorobanClient.Asset("eduCert", issuerPublicKey);

console.log(eduCert);
// First, the receiving account must trust the asset
server
.getAccount(distributorPublicKey)
.then(function (receiver) {
    console.log(receiver)
    var transaction = new SorobanClient.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: SorobanClient.Networks.TESTNET,
    })
.addOperation(SorobanClient.Operation.changeTrust({
      asset: eduCert,
      limit: "1000",
    }))
    .setTimeout(30)
    .build();

    transaction.sign(distributorKeyPair);
    return server.submitTransaction(transaction);
  })
  .then(console.log)
  .catch(function (error) {
    console.error("Error in trust transaction!", error);
  });
