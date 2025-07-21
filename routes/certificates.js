const express = require("express");
const router = express.Router();
const cors = require('cors');
const SorobanClient = require('soroban-client');
const Certificate = require("../models/certificates");
const ValidCertificates = require("../models/ValidCertificate");
const Notification = require("../models/Notification");
const app = express();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');
const retry = require('async-retry');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(FormData);
const domain = process.env.MAILGUN_DOMAIN;
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY,
  url: 'https://api.mailgun.net'
});
app.use(cors());

router.post("/diploma", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  try {

    // Store the issuer and distributor key to MongoDB

    console.log("test");
    const saltRounds = 10; // Number of salt rounds for bcrypt to use
    // Issuer
    const issuerKeyPair = SorobanClient.Keypair.random();
    const issuerSecretKey = issuerKeyPair.secret();
    const issuerPublicKey = issuerKeyPair.publicKey();
    // Distributor
    const distributorKeyPair = SorobanClient.Keypair.random();
    const distributorSecretKey = distributorKeyPair.secret();
    const distributorPublicKey = distributorKeyPair.publicKey();
    // Store the issuer and distributor key to MongoDB
    const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
    const hashedDistributorSecretKey = await bcrypt.hash(
      distributorSecretKey,
      saltRounds
    );

    const newCertificate = new Certificate({
      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null, // Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,
    });

    const savedCertificate = await newCertificate.save();
    console.log("issuerPublicKey", issuerPublicKey);
    console.log("issuerPublicKey", distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.NFT_STORAGE_API_KEY;

    //server.getAccount(issuerPublicKey).then(function (r) {
    // console.log(r);
    //});
    const diplomaTemplatePath = path.join(__dirname, '../assets/images/newDiploma.png');
    const img = await Jimp.read(diplomaTemplatePath);
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    // Center the name horizontally on the line at y=700
    const name = req.body.name;
    const imageWidth = img.bitmap.width;
    const nameWidth = Jimp.measureText(font, name);
    const x = (imageWidth - nameWidth) / 2;
    const y = 700; // Adjust this value if the line is at a different y position
    img.print(font, x, y, name);
    const outputDiplomaPath = path.join(__dirname, '../assets/images/newdiplomav2.jpg');
    await img.writeAsync(outputDiplomaPath); // save

    // Pinata API credentials from environment variables
    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;

    // Upload to Pinata
    const formData = new FormData();
    formData.append('file', fs.createReadStream(outputDiplomaPath));
    const pinataRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxContentLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });
    const cid = pinataRes.data.IpfsHash;
    console.log('stored files with cid:', cid);

    // Update the savedCertificate object with the cid
    savedCertificate.cid = cid;
    await savedCertificate.save();

    const data = {
      from: 'hi@edunode.org',
      to: req.body.email,
      subject: 'Congrats for your Certification',
      text: 'Please find attached the E-certification!.',
      html: `<!DOCTYPE html>
      <html>
      <head>
        <title>Email with Share Buttons </title>
      </head>
      <body>
        <h1>Share on Social Media</h1>
        <p>Click the buttons below to share on Twitter or LinkedIn:</p>
      
        <a href="https://twitter.com/intent/tweet?url=https%3A%2F%2F${encodeURIComponent(cid)}.ipfs.w3s.link%2Fnewdiplomav2.jpg&text=I'm so honored to annouce that i have finished a course on EduNode and got this Certification !!" target="_blank" rel="noopener noreferrer">
          Share on Twitter
        </a>
      <br></br>
        <a href="https://www.linkedin.com/shareArticle?url=https%3A%2F%2F${encodeURIComponent(cid)}.ipfs.w3s.link%2Fnewdiplomav2.jpg&title=I'm so honored to annouce that i have finished a course on EduNode and got this Certification !!" target="_blank" rel="noopener noreferrer">
          Share on LinkedIn
        </a>
      
        <br><br>
      </body>
      </html>
      `,
      attachment: outputDiplomaPath,
    };
    mg.messages.create(domain, data)
      .then(body => {
        console.log('Email sent successfully:', body);
        res.json({ msg: 'Email sent' });
      })
      .catch(error => {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
      });
    const newNotification = new Notification({
      message:
        "Congrats! You have a new certification for the Basic Concepts Course",
      time: new Date(),
      email: req.body.email,
    });

    await newNotification.save();

    res.status(200).json(savedCertificate);
  } catch (error) {
    // Enhanced error logging
    console.error('Error in /diploma endpoint:', error);
    if (error.response) {
      console.error('Pinata response data:', error.response.data);
      console.error('Pinata response status:', error.response.status);
      console.error('Pinata response headers:', error.response.headers);
    }
    res.status(500).send("Server Error");
    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Promise Rejection:", error);
    });
  }
});


router.post("/diploma1", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  try {

    // Store the issuer and distributor key to MongoDB


    const saltRounds = 10; // Number of salt rounds for bcrypt to use
    // Issuer
    const issuerKeyPair = SorobanClient.Keypair.random();
    const issuerSecretKey = issuerKeyPair.secret();
    const issuerPublicKey = issuerKeyPair.publicKey();
    // Distributor
    const distributorKeyPair = SorobanClient.Keypair.random();
    const distributorSecretKey = distributorKeyPair.secret();
    const distributorPublicKey = distributorKeyPair.publicKey();
    // Store the issuer and distributor key to MongoDB
    const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
    const hashedDistributorSecretKey = await bcrypt.hash(
      distributorSecretKey,
      saltRounds
    );

    const newCertificate = new Certificate({
      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null, // Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,
    });

    const savedCertificate = await newCertificate.save();
    console.log("issuerPublicKey", issuerPublicKey);
    console.log("issuerPublicKey", distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    //server.getAccount(issuerPublicKey).then(function (r) {
    // console.log(r);
    //});
    const client = new Web3Storage({ token });
    const img = await Jimp.read("operation.png");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
    img.write("newdiplomav2.jpg"); // save

    const putFilesToWeb3Storage = async () => {
      const files = await getFilesFromPath("newdiplomav2.jpg");
      const cid = await client.put(files);
      console.log("stored files with cid:", cid);
      return cid;
    };

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



    const newNotification = new Notification({
      message:
        "Congrats! You have a new certification for the Basic Concepts Course",
      time: new Date(),
      email: req.body.email,
    });

    await newNotification.save();

    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Promise Rejection:", error);
      // Optionally, you can perform additional error handling or logging here
    });

  }
});

router.post("/diploma2", async (req, res) => {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");
  // Store the issuer and distributor key to mongoDB
  try {
    console.log("test")
    const saltRounds = 10; // Number of salt rounds for bcrypt to use
    // Issuer
    const issuerKeyPair = SorobanClient.Keypair.random();
    const issuerSecretKey = issuerKeyPair.secret();
    const issuerPublicKey = issuerKeyPair.publicKey();
    // Distributor
    const distributorKeyPair = SorobanClient.Keypair.random();
    const distributorSecretKey = distributorKeyPair.secret();
    const distributorPublicKey = distributorKeyPair.publicKey();
    // Store the issuer and distributor key to mongoDB
    const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
    const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
    try {
      const newCertificate = new Certificate({

        name: req.body.name,
        email: req.body.email,
        pkey: req.body.pkey,
        cid: null,// Initialize cid to null,
        certificateNumber: Math.floor(Math.random() * 1000000),
        issuerSecretKey: hashedIssuerSecretKey,
        issuerPublicKey: issuerPublicKey,
        distributorSecretKey: hashedDistributorSecretKey,
        distributorPublicKey: distributorPublicKey,

      });
      const savedCertificate = await newCertificate.save();
      console.log('issuerPublicKey', issuerPublicKey);
      console.log('issuerPublicKey', distributorPublicKey);
      // Replace the token with your own API key
      //const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDlhYjlGNDI0Mzk2OGVEOTVmYThCYTVEMDEwQjU0YzE4N2M3ZWZlZjMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2ODEyMDY5MDQyNDMsIm5hbWUiOiJlZHVub2RlIn0.oVxeBO1VhEXwYvU5CnNUs5tYnx4lVm55oLkweDX7kJQ";
      const token = process.env.WEBTHREE_API_TOKEN;
      const client = new Web3Storage({ token })
      const img = await Jimp.read('anchors.png')
      const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
      img.print(font, 400, 740, req.body.name);
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
          console.log('web3')
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



      res.status(200).json(savedCertificate);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Errorr");
    }


    const newNotification = new Notification({
      message: 'Congrats! You have a new certification for the Anchors Course',
      time: new Date(),
      email: req.body.email,
    });



    await newNotification.save();

    console.log('notification saved !')
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");

    process.on("unhandledRejection", (error) => {
      console.error("Unhandled Promise Rejection:", error);
      // Optionally, you can perform additional error handling or logging here
    });
  }

});

router.post("/diploma3", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");
  console.log("test")
  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });
    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN; v

    const client = new Web3Storage({ token })
    const img = await Jimp.read('sep.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the SEPs Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});

router.post("/diploma4", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  // Store the issuer and distributor key to mongoDB

  console.log("test")
  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });

    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    const client = new Web3Storage({ token })
    const img = await Jimp.read('hyperledger.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the Hyperledger Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});
router.post("/diploma5", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  // Store the issuer and distributor key to mongoDB

  console.log("test")
  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });

    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    const client = new Web3Storage({ token })
    const img = await Jimp.read('soroban.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the Soroban Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});
router.post("/diploma6", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  // Store the issuer and distributor key to mongoDB


  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });

    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    const client = new Web3Storage({ token })
    const img = await Jimp.read('euthereum.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the Ethereum Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});

router.post("/diploma7", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  // Store the issuer and distributor key to mongoDB

  console.log("test")
  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });

    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    const client = new Web3Storage({ token })
    const img = await Jimp.read('oracles.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the Oracles Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});
router.post("/challenge1", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  res.header("Content-Type", "application/json");

  // Store the issuer and distributor key to mongoDB

  console.log("test")
  const saltRounds = 10; // Number of salt rounds for bcrypt to use
  // Issuer
  const issuerKeyPair = SorobanClient.Keypair.random();
  const issuerSecretKey = issuerKeyPair.secret();
  const issuerPublicKey = issuerKeyPair.publicKey();
  // Distributor
  const distributorKeyPair = SorobanClient.Keypair.random();
  const distributorSecretKey = distributorKeyPair.secret();
  const distributorPublicKey = distributorKeyPair.publicKey();
  // Store the issuer and distributor key to mongoDB
  const hashedIssuerSecretKey = await bcrypt.hash(issuerSecretKey, saltRounds);
  const hashedDistributorSecretKey = await bcrypt.hash(distributorSecretKey, saltRounds);
  try {
    const newCertificate = new Certificate({

      name: req.body.name,
      email: req.body.email,
      pkey: req.body.pkey,
      cid: null,// Initialize cid to null,
      certificateNumber: Math.floor(Math.random() * 1000000),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: issuerPublicKey,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: distributorPublicKey,

    });

    const savedCertificate = await newCertificate.save();
    console.log('issuerPublicKey', issuerPublicKey);
    console.log('issuerPublicKey', distributorPublicKey);
    // Replace the token with your own API key
    const token = process.env.WEBTHREE_API_TOKEN;

    const client = new Web3Storage({ token })
    const img = await Jimp.read('rust.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font, 400, 740, req.body.name);
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



    res.status(200).json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Errorr");
  }


  const newNotification = new Notification({
    message: 'Congrats! You have a new certification for the Oracles Course',
    time: new Date(),
    email: req.body.email,
  });



  await newNotification.save();

  console.log('notification saved !')

});

router.get('/certificateNumber/:email', async (req, res) => {
  const email = req.params.email;
  const certificates = await Certificate.find({ email }, 'certificateNumber');
  const certificateNumbers = certificates.map(certificate => certificate.certificateNumber);
  res.json(certificateNumbers);
});

router.get("/:email", async (req, res) => {
  try {
    const certificates = await Certificate.find({ email: req.params.email });
    const certificateData = certificates.map(cert => ({
      certificateNumber: cert.certificateNumber,
      issuerPublicKey: cert.issuerPublicKey,
      distributorPublicKey: cert.distributorPublicKey,
      cid: `https://${cert.cid}.ipfs.w3s.link/newdiplomav2.jpg`
    }));
    res.status(200).json(certificateData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/pkey/:pkey", async (req, res) => {
  try {
    const certificates = await Certificate.find({ pkey: req.params.pkey });
    const certificateData = certificates.map(cert => ({
      certificateNumber: cert.certificateNumber,
      issuerPublicKey: cert.issuerPublicKey,
      distributorPublicKey: cert.distributorPublicKey,
      cid: `https://${cert.cid}.ipfs.w3s.link/newdiplomav2.jpg`
    }));
    res.status(200).json(certificateData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

// Define the route to get a certificate by its certificate number
router.get('/cert/:certificateNumber', async (req, res) => {
  try {
    const certificateNumber = req.params.certificateNumber;
    const certificate = await Certificate.findOne({ certificateNumber });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
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

router.get("/count/pkey/:pkey", async (req, res) => {
  try {
    const { pkey } = req.params;
    const certificateCount = await Certificate.aggregate([
      { $match: { pkey } },
      { $group: { _id: "$pkey", count: { $sum: 1 } } },
      { $project: { _id: 0, pkey: "$_id", count: 1 } }
    ]);
    res.json(certificateCount);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/notification/:email", async (req, res) => {

  try {
    const notifications = await Notification.find({ email: req.params.email });
    const notificationData = notifications.map(notif => ({
      notificationMessage: notif.message,
      notificationDate: notif.date,
      email: notif.email,

    }));
    res.status(200).json(notificationData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.get("/notificationgg", async (req, res) => {
  console.log("heloooooooooooobit");
  try {
    const notifications = await Notification.find();
    const notificationData = notifications.map(notif => ({
      notificationMessage: notif.message,
      notificationDate: notif.date,
      email: notif.email,

    }));
    res.status(200).json(notificationData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});




router.get("/notification/count/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const notificationCount = await Notification.aggregate([
      { $match: { email } },
      { $group: { _id: "$email", count: { $sum: 1 } } },
      { $project: { _id: 0, email: "$_id", count: 1 } }
    ]);
    res.json(notificationCount);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

router.put('/increment-trophy', async (req, res) => {
  const { email } = req.body;
  const newNotification = new Notification({
    message:
      "Congrats! You have a new Course Badge for finishig a Course !",
    time: new Date(),
    email: req.body.email,
  });
  await newNotification.save();

  try {
    // Find the user by their email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment the trophy value by 1
    user.CoursesTrophy += 1;

    // Save the updated user to the database
    await user.save();

    return res.status(200).json({ message: 'Trophy incremented successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }


});

router.put('/challenge/increment-Challenge', async (req, res) => {
  const { email } = req.body;
  const newNotification = new Notification({
    message:
      "Congrats! You have a new Challenge Badge for finishig a Challenge !",
    time: new Date(),
    email: req.body.email,
  });
  await newNotification.save();
  try {
    // Find the user by their email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Increment the trophy value by 1
    user.ChallengesTrophy += 1;

    // Save the updated user to the database
    await user.save();

    return res.status(200).json({ message: 'Trophy incremented successfully' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});


router.post("/validCertificate", async (req, res) => {
  try {
    const { name, url, email, university, image } = req.body;
    //const authorEmail= req.user.auth.email;
    const validCertificate = new ValidCertificates({
      name,
      url,
      university,
      email,
      image
    });

    await validCertificate.save();
    res.status(201).json(validCertificate);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});




// GET route to fetch all valid certificates
router.get("/valid", async (req, res) => {
  try {
    const certificates = await ValidCertificates.find();
    console.log('certificate')
    res.json(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
module.exports = router;