var SorobanClient = require("soroban-client");
var server = new SorobanClient.Server("https://rpc-futurenet.stellar.org:443/");
console.log(server)

// Issuer 
const keyPair = SorobanClient.Keypair.random()
const secretKey = SorobanClient.Keypair.random().secret()
const publicKey = SorobanClient.Keypair.random().publicKey()

// Distributor

const keyPairtwo = SorobanClient.Keypair.random()
const secretKeytwo = SorobanClient.Keypair.random().secret()
const publicKeytwo = SorobanClient.Keypair.random().publicKey()


console.log(secretKey)
console.log(publicKey)


console.log(secretKeytwo)
console.log(publicKeytwo)
// // Keys for accounts to issue and receive the new asset
// var issuingKeys = SorobanClient.Keypair.fromSecret(
//   "SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4",
// );
// var receivingKeys = SorobanClient.Keypair.fromSecret(
//   "SDSAVCRE5JRAI7UFAVLE5IMIZRD6N6WOJUWKY4GFN34LOBEEUS4W2T2D",
// );



// // Create an object to represent the new asset
var eduCert = new SorobanClient.Asset("eduCert", publicKey);

// First, the receiving account must trust the asset
server
  .getAccount(secretKeytwo)
  .then(function (receiver) {
    var transaction = new SorobanClient.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: SorobanClient.Networks.TESTNET,
    })
      // The `changeTrust` operation creates (or alters) a trustline
      // The `limit` parameter below is optional
      .addOperation(
        SorobanClient.Operation.changeTrust({
          asset: eduCert,
          limit: "1000",
        }),
      )
      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
    transaction.sign(secretKeytwo);
    return server.submitTransaction(transaction);
  })
  .then(console.log)

  // Second, the issuing account actually sends a payment using the asset
  .then(function () {
    return server.loadAccount(publicKey);
  })
  .then(function (issuer) {
    var transaction = new SorobanClient.TransactionBuilder(issuer, {
      fee: 100,
      networkPassphrase: SorobanClient.Networks.TESTNET,
    })
      .addOperation(
        SorobanClient.Operation.payment({
          destination: receivingKeys.publicKey(),
          asset: astroDollar,
          amount: "10",
        }),
      )
      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
    transaction.sign(issuingKeys);
    return server.submitTransaction(transaction);
  })
  .then(console.log)
  .catch(function (error) {
    console.error("Error!", error);
});