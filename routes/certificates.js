const express = require("express");
const router = express.Router();
const cors = require('cors');
const SorobanClient = require('soroban-client');
const server = new SorobanClient.Server('https://rpc-futurenet.stellar.org:443/');
const Certificate = require("../models/certificates");
const Notification = require("../models/Notification");
const app = express();
const { Web3Storage, getFilesFromPath } = require('web3.storage')
const { create } = require('ipfs-http-client')
const Jimp = require('jimp');
const retry = require('async-retry');
const fs = require('fs');
const bcrypt = require('bcryptjs');


app.use(cors());

router.post("/diploma", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    const token = process.env.WEBTHREE_API_TOKEN;
    
    //server.getAccount(issuerPublicKey).then(function (r) {
     // console.log(r);
    //});
    const client = new Web3Storage({ token });
    const img = await Jimp.read("newediploma.png");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    img.print(font, 150, 350, req.body.name);
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

}});


router.post("/diploma1", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    const token = process.env.WEBTHREE_API_TOKEN;
    
    //server.getAccount(issuerPublicKey).then(function (r) {
     // console.log(r);
    //});
    const client = new Web3Storage({ token });
    const img = await Jimp.read("operation.png");
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font,400, 740, req.body.name);
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

}});

router.post("/diploma2", async (req, res) => {

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
     const token=process.env.WEBTHREE_API_TOKEN;
    const client = new Web3Storage({ token })
    const img = await Jimp.read('anchors.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font,400, 740, req.body.name);
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
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    const token = process.env.WEBTHREE_API_TOKEN;v
    
    const client = new Web3Storage({ token })
    const img = await Jimp.read('sep.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font,400, 740, req.body.name);
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
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    img.print(font,400, 740, req.body.name);
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
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    img.print(font,400, 740, req.body.name);
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
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    const img = await Jimp.read('euthereum.png')
    const font = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    img.print(font,400, 740, req.body.name);
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
  res.header("Access-Control-Allow-Headers","Origin,X-Requested-With,Content-Type,Accept,content-type,application/json" );
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
    img.print(font,400, 740, req.body.name);
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

router.get('/:certificateNumber', (req, res) => {
  const certificateNumber = req.params.certificateNumber;
  // Fetch the certificate image data based on the certificateNumber
  // Send the image data back to the client as a response
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
module.exports = router;