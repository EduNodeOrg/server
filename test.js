const StellarSdk = require("stellar-sdk")

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

var issuingKeys = StellarSdk.Keypair.fromSecret(
  "SB2NVCY6UZCXH4VWG3S62ZSMOODBY6RQRZVJ2Z2BYIP4UURNWKYOCT5U",
);
var receivingKeys = StellarSdk.Keypair.fromSecret(
  "SCXCLJ5CAFAY5Z2BBMN5WDDJEBZBIDBNDBKSMEVSFWLWVVO45WNPUVTB",
);

// Create an object to represent the new asset
var eCertificate = new StellarSdk.Asset("eDiploma", issuingKeys.publicKey());

// First, the receiving account must trust the asset
server
  .loadAccount(receivingKeys.publicKey())
  .then(function (receiver) {
  var transaction = new StellarSdk.TransactionBuilder(receiver, {

      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      // The `changeTrust` operation creates (or alters) a trustline
      // The `limit` parameter below is optional
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: eCertificate,
          limit: "1000",
        }),
      )
      // setTimeout is required for a transaction
      .setTimeout(100)
      .addMemo(StellarSdk.Memo.text('EduNode!'))
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
    var ipfs ="bafybeic6jyf3flr4z6bptkv2d65zvqrhxee2nwxwwwkpecql7qvvcd66ou"
    var transaction = new StellarSdk.TransactionBuilder(issuer, {
      fee: 100,
      networkPassphrase: StellarSdk.Networks.TESTNET,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: receivingKeys.publicKey(),
          asset: eCertificate,
          amount: "0.0000001",
        }),
      )
      

      // Manage data operation
      .addOperation(
        
        StellarSdk.Operation.manageData({
          name: "ipfshash",
          value: ipfs,
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

