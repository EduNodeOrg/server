const StellarSdk = require("stellar-sdk")

const server = new StellarSdk.Server("https://horizon-testnet.stellar.org");

var issuingKeys = StellarSdk.Keypair.fromSecret(
  "SCHFRP7RDU4SB5G3FDL2G3CR2Z6LYDY5DQDG3KELWFFBFTKZR7EUXII3",
);
var receivingKeys = StellarSdk.Keypair.fromSecret(
  "SCGWI2TGH7KUJAASHWYLGDWJFDBJOPBEUCFJPVBZQLKZBPFJACV4BIDX",
);

// Create an object to represent the new asset
var eCertificate = new StellarSdk.Asset("ipfslol", issuingKeys.publicKey());

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
      .addMemo(StellarSdk.Memo.text('eDiploma!'))
      .build();
      console.log(transaction.toEnvelope().toXDR('base64'));
    // transaction.sign(receivingKeys);
    // return server.submitTransaction(transaction);
  })
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
          name: "ipfstestlol",
          value: ipfs,
        }),
      )

      // setTimeout is required for a transaction
      .setTimeout(100)
      .build();
      console.log(transaction.toEnvelope().toXDR('base64'));
    // transaction.sign(issuingKeys);
    // return server.submitTransaction(transaction);
  })