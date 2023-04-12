const express = require("express");
const router = express.Router();
const cors = require('cors');
const Certificate = require("../models/certificates");
const app = express();
const { Web3Storage, getFilesFromPath } = require('web3.storage') 
const { create } = require('ipfs-http-client')
var Jimp = require('jimp');
const retry = require('async-retry');
const fs = require('fs');

app.use(cors());

router.post("/diploma", async (req, res) => {
  console.log("test")
  try {
    const newCertificate = new Certificate({
      image: req.body.image,
      name: req.body.name,
      email: req.body.email,
      cid: null // Initialize cid to null
    });
    const savedCertificate = await newCertificate.save();
   
    // Replace the token with your own API key
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDlhYjlGNDI0Mzk2OGVEOTVmYThCYTVEMDEwQjU0YzE4N2M3ZWZlZjMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODEyMDY5MDQyNDMsIm5hbWUiOiJlZHVub2RlIn0.oVxeBO1VhEXwYvU5CnNUs5tYnx4lVm55oLkweDX7kJQ";

    const client = new Web3Storage({ token })
    const img =  await Jimp.read('newediploma.png')
    const font =  await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    img.print(font, 150, 350,  req.body.name);
    img.write('newdiplomav2.jpg'); // save

    const putFilesToWeb3Storage = async () => {
      const files = await getFilesFromPath('newdiplomav2.jpg')
      const cid = await client.put(files)
      console.log('stored files with cid:', cid)
      return cid;
    }

    const cid = await retry(
      async (bail, attempt) => {
        console.log(`Attempt ${attempt} putting files to web3.storage...`);
        const result = await putFilesToWeb3Storage();
        return result;
      },
      {
        retries: 3, // number of retries
        minTimeout: 1000, // minimum delay in ms between retries
        maxTimeout: 5000, // maximum delay in ms between retries
        onRetry: (error, attempt) => {
          console.log(`Attempt ${attempt} failed: ${error}`);
        },
      }
    );

// Update the savedCertificate object with the cid
savedCertificate.cid = cid;
await savedCertificate.save();

 {/* 
    // Create an IPFS client instance
    const ipfs = create({ host: 'ipfs.infuro.io', port: '5001', protocol: 'http' })

    const img = await Jimp.read('newediploma.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK)
    img.print(font, 150, 350, 'Leonardo');
    img.write('newdiplomav2.jpg'); // save

    const putFileToIPFS = async () => {
      const stream = fs.createReadStream('newdiploma3.jpg')
      const cid = await ipfs.add(stream, { 
        progress: (prog) => console.log(`received: ${prog}`),
        wrapWithDirectory: true, // wrap the file with a directory object
        pin: true, // pin the file in IPFS
        duplex: true 
     })
      console.log('stored file with cid:', cid.path)
      return cid.path;
    }

    const cid = await retry(
      async (bail, attempt) => {
        console.log(`Attempt ${attempt} putting file to IPFS...`);
        const result = await putFileToIPFS();
        return result;
      },
      {
        retries: 3, // number of retries
        minTimeout: 1000, // minimum delay in ms between retries
        maxTimeout: 5000, // maximum delay in ms between retries
        onRetry: (error, attempt) => {
          console.log(`Attempt ${attempt} failed: ${error}`);
        },
      }
    );
*/}

    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }
});


router.get("/:email", async (req, res) => {
  try {
    const certificates = await Certificate.find({ email: req.params.email }).select('cid');
    const cids = certificates.map(cert => `https://${cert.cid}.ipfs.w3s.link/newdiplomav2.jpg`);
    res.status(200).json(cids);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/count/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const certificateCount = await Certificate.aggregate([
      { $match: { email } },
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $project: { _id: 0, email: "$_id", count: 1 } }
    ]);
    res.json(certificateCount);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
module.exports = router;
