const express = require('express');
const router = express.Router();
const certificates = require('../models/certificates');
// Import the Stellar Router SDK and helpers
let StellarRouterSdk;
(async () => {
  ({ StellarRouterSdk } = await import("@creit-tech/stellar-router-sdk"));
})();
const { Address, nativeToScVal } = require("@stellar/stellar-sdk");

// POST /nftCertificate
router.post('/', async (req, res) => {
  try {
    const {
      image,
      name,
      university,
      url,
      email,
      cid,
      pkey,
      certificateNumber,
      issuerPublicKey,
      issuerSecretKey,
      distributorSecretKey,
      distributorPublicKey
    } = req.body;

    // 1. Prepare the NFT minting call using the router SDK
    const routerSdk = new StellarRouterSdk({ rpcUrl: "https://mainnet.sorobanrpc.com" });

    // TODO: Replace with your actual NFT contract address
    const nftContract = "NFT_CONTRACT_ADDRESS";
    // Prepare arguments: recipient and metadata URI
    const recipient = distributorPublicKey; // or whichever address should receive the NFT
    const recipientAddress = Address.account(recipient); // Explicitly mark as account address
    const metadataUri = url || image || cid || "https://example.com/metadata.json"; // choose the best field for metadata

    const invocations = [{
      contract: nftContract,
      method: "mint",
      args: [
        recipientAddress.toScVal(),
        nativeToScVal(metadataUri, { type: "string" }),
      ],
    }];

    // 2. Build the operation (does not submit yet)
    const operation = routerSdk.exec(issuerPublicKey, invocations);

    // 3. Save certificate + NFT info to MongoDB, including the operation XDR
    const cert = new certificates({
      image,
      name,
      university,
      url,
      email,
      cid,
      pkey,
      certificateNumber,
      issuerPublicKey,
      issuerSecretKey,
      distributorSecretKey,
      distributorPublicKey,
      operationXdr: operation.toXDR("base64"), // Save the operation XDR for later signing/submission
    });
    await cert.save();

    // 4. Return the NFT/certificate info and operation XDR
    res.status(201).json({
      success: true,
      certificate: cert,
      nftOperationXdr: operation.toXDR("base64"),
      note: "You must sign and submit this operation to the Stellar network to mint the NFT. Replace NFT_CONTRACT_ADDRESS with your contract address."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
