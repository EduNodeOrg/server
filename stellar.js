var SorobanClient = require("soroban-client");
var server = new SorobanClient.Server("https://horizon-testnet.stellar.org");

// Keys for accounts to issue and receive the new asset
var issuingKeys = SorobanClient.Keypair.fromSecret(
  "SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4",
);
var receivingKeys = SorobanClient.Keypair.fromSecret(
  "SDSAVCRE5JRAI7UFAVLE5IMIZRD6N6WOJUWKY4GFN34LOBEEUS4W2T2D",
);

// Create an object to represent the new asset
var astroDollar = new SorobanClient.Asset("EduCert", issuingKeys.publicKey());

// First, the receiving account must trust the asset
server
  .getAccount(receivingKeys.publicKey())
  .then(function (receiver) {
    var transaction = new SorobanClient.TransactionBuilder(receiver, {
      fee: 100,
      networkPassphrase: SorobanClient.Networks.TESTNET,
    })
      // The `changeTrust` operation creates (or alters) a trustline
      // The `limit` parameter below is optional
      .addOperation(
        SorobanClient.Operation.changeTrust({
          asset: astroDollar,
          limit: "1000",
        }),
      )
      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
    transaction.sign(receivingKeys);
    return server.submitTransaction(transaction);
  })
  .then(console.log)

  // Second, the issuing account actually sends a payment using the asset
  .then(function () {
    return server.loadAccount(issuingKeys.publicKey());
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