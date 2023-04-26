// var StellarSdk = require('stellar-sdk');
var SorobanClient = require('soroban-client');
// var fetch = require('node-fetch');
var axios = require('axios');
 // Use the test network; remove this line for the public network



// console.log(keypair)
// The SDK does not have tools for creating test accounts, so you'll have to
// make your own HTTP request.

// if you're trying this on Node, install the `node-fetch` library and
// uncomment the next line:


(async function main() {
    const keypair = SorobanClient.Keypair.random();
    try {
    //   const response = await fetch(
    //     `https://friendbot.stellar.org?addr=${encodeURIComponent(
    //         keypair.publicKey(),
    //     )}`,
    //   );
      
    //   const responseJSON = await response.json();
    const response = await axios.get(`https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`);

      console.log("SUCCESS! You have a new account :)\n", response.data);
    } catch (e) {
      console.error("ERROR!", e);
    }
    // After you've got your test lumens from friendbot, we can also use that account to create a new account on the ledger.
    try {
      const server = new SorobanClient.Server("https://rpc-futurenet.stellar.org:443/");
      var parentAccount = await server.getAccount(keypair.publicKey()); //make sure the parent account exists on ledger
      var childAccount = SorobanClient.Keypair.random(); //generate a random account to create
      //create a transacion object.
      var createAccountTx = new SorobanClient.TransactionBuilder(parentAccount, {
        fee: SorobanClient.BASE_FEE,
        networkPassphrase: SorobanClient.Networks.TESTNET,
      });
      //add the create account operation to the createAccountTx transaction.
      createAccountTx = await createAccountTx
        .addOperation(
            SorobanClient.Operation.createAccount({
            destination: childAccount.publicKey(),
            startingBalance: "5",
          }),
        )
        .setTimeout(180)
        .build();
      //sign the transaction with the account that was created from friendbot.
      await createAccountTx.sign(keypair);
      //submit the transaction
      let txResponse = await server
        .submitTransaction(createAccountTx)
        // some simple error handling
        .catch(function (error) {
          console.log("there was an error");
          console.log(error.response);
          console.log(error.status);
          console.log(error.extras);
          return error;
        });
      console.log(txResponse);
      console.log("Created the new account", childAccount.publicKey());
    } catch (e) {
      console.error("ERROR!", e);
    }
  })();

