const express = require("express");
const router = express.Router();
const cors = require('cors');
const SorobanClient = require('soroban-client');
const Certificate = require("../models/certificates");
const ValidCertificates = require("../models/ValidCertificate");
const Notification = require("../models/Notification");
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs').promises;
const path = require('path');
const Jimp = require('jimp');
const retry = require('async-retry');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Mailgun = require('mailgun.js');
const rateLimit = require('express-rate-limit');
// Removed validator dependency - using built-in validation functions
const helmet = require('helmet');
const { DiplomaNFTInteraction, DiplomaUtils } = require('../utils/contract');
const DIPLOMA_NFT_CONTRACT = "CBTGYCVE27SUBICFXLTR53IELNCHYRPDSH3DRGRW6VNETMTOFILRB535";

// Security middleware
router.use(helmet());

// Rate limiting
const certificateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 certificate requests per windowMs
  message: 'Too many certificate requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Mailgun setup
const mailgun = new Mailgun(FormData);
const domain = process.env.MAILGUN_DOMAIN;
const mg = mailgun.client({
  username: 'api', 
  key: process.env.MAILGUN_API_KEY || 'key-c8d12b7428fbe666e074108aaa0820bc',
  url: 'https://api.mailgun.net'
});

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
};

router.use(cors(corsOptions));

// Built-in validation functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 254;
};

const isValidURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};
// Input validation middleware
const validateCertificateInput = (req, res, next) => {
  const { name, email, pkey } = req.body;
  
  if (!name || !email || !pkey) {
    return res.status(400).json({ error: 'Name, email, and public key are required' });
  }
  
 // if (!isValidEmail(email)) {
   // return res.status(400).json({ error: 'Invalid email format' });
  // }
  
  if (name.length > 100) {
    return res.status(400).json({ error: 'Name is too long' });
  }
  
  // Basic validation for Stellar public key format
  
  next();
};  

// Certificate configuration
const CERTIFICATE_CONFIGS = {
  diploma: {
    template: 'basicConcepts.png',
    course: 'Basic Concepts',
    message: 'Congrats! You have a new certification for the Basic Concepts Course by EduNode'
  },
  diploma1: {
    template: 'basicConcepts.png',
    course: 'Operations',
    message: 'Congrats! You have a new certification for the Operations Course by EduNode'
  },
  diploma2: {
    template: 'basicConcepts.png',
    course: 'Anchors',
    message: 'Congrats! You have a new certification for the Anchors Course by EduNode'
  },
  diploma3: {
    template: 'basicConcepts.png',
    course: 'SEPs',
    message: 'Congrats! You have a new certification for the SEPs Course by EduNode'
  },
  diploma4: {
    template: 'basicConcepts.png',
    course: 'Hyperledger',
    message: 'Congrats! You have a new certification for the Hyperledger Course by EduNode'
  },
  diploma5: {
    template: 'basicConcepts.png',
    course: 'Soroban',
    message: 'Congrats! You have a new certification for the Soroban Course by EduNode'
  },
  diploma6: {
    template: 'basicConcepts.png',
    course: 'Ethereum',
    message: 'Congrats! You have a new certification for the Ethereum Course by EduNode'
  },
  diploma7: {
    template: 'basicConcepts.png',
    course: 'Oracles',
    message: 'Congrats! You have a new certification for the Oracles Course by EduNode'
  },
  diploma8: {
    template: 'basicConcepts.png',
    course: 'Computer System Engineering',
    message: 'Congrats! You have a new certification for the Computer System Engineering Course by MIT and EduNode.'
  },
  diploma9: {
    template: 'basicConcepts.png',
    course: 'Cryptocurrency Engineering And Design',
    message: 'Congrats! You have a new certification for the Cryptocurrency Engineering And Design Course MIT and EduNode'
  },
  diploma10: {
    template: 'bootcamp.png',
    course: 'Bootcamp Women in Tech',
    message: '' // empty
  },
  challenge1: {
    template: 'basicConcepts.png',
    course: 'Rust Challenge',
    message: 'Congrats! You have a new certification for the Rust Challenge by EduNode'
  }
};

// Utility functions
const generateKeyPairs = () => {
  const issuerKeyPair = SorobanClient.Keypair.random();
  const distributorKeyPair = SorobanClient.Keypair.random();
  
  return {
    issuer: {
      secret: issuerKeyPair.secret(),
      public: issuerKeyPair.publicKey()
    },
    distributor: {
      secret: distributorKeyPair.secret(),
      public: distributorKeyPair.publicKey()
    }
  };
};

const hashKeys = async (secretKey, saltRounds = 12) => {
  return await bcrypt.hash(secretKey, saltRounds);
};

const generateCertificateNumber = () => {
  // More secure random number generation
  return Math.floor(Math.random() * 900000000) + 100000000; // 9-digit number
};

const createCertificateImage = async (templateName, recipientName, courseMessage) => {
  const templatePath = path.join(__dirname, '../assets/images', templateName);
  const outputPath = path.join(__dirname, '../assets/images/output', `cert_${Date.now()}.jpg`);
  
  try {
    const img = await Jimp.read(templatePath);
    
    // Load a more elegant font for the name (using built-in Jimp font)
    const nameFont = await Jimp.loadFont(Jimp.FONT_SANS_128_BLACK);
    const messageFont = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);
    
    const imageWidth = img.bitmap.width;
    const imageHeight = img.bitmap.height;
    
    // Convert name to uppercase for better appearance
    const nameText = recipientName.toUpperCase();
    
    // Calculate text width for horizontal centering
    const textWidth = Jimp.measureText(nameFont, nameText);
    const x = (imageWidth - textWidth) / 2;
    
    // Position name at 40% height (above the line)
    const y = Math.floor(imageHeight * 0.45);
    
    // Add name
    img.print(nameFont, x, y, nameText);
    
    // Add course message below the line
    const messageText = courseMessage;
    const messageX = 100; // Left margin
    const messageY = Math.floor(imageHeight * 0.65); // Position message at 85% height (much lower)
    const maxWidth = imageWidth - 200; // Max width with margins
    
    // Print wrapped text for the message
    await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK).then(font => {
      img.print(
        font,
        messageX,
        messageY,
        {
          text: messageText,
          alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
          alignmentY: Jimp.VERTICAL_ALIGN_TOP
        },
        maxWidth
      );
    });
    
    await img.writeAsync(outputPath);
    return outputPath;
  } catch (error) {
    console.error('Error creating certificate image:', error);
    throw new Error('Failed to create certificate image');
  }
};

const uploadToPinata = async (filePath) => {
  const pinataApiKey = process.env.PINATA_API_KEY;
  const pinataSecretApiKey = process.env.PINATA_SECRET_API_KEY;
  
  if (!pinataApiKey || !pinataSecretApiKey) {
    throw new Error('Pinata credentials not configured');
  }
  
  const formData = new FormData();
  const fileStream = await fs.readFile(filePath);
  formData.append('file', fileStream, path.basename(filePath));
  
  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      maxContentLength: Infinity,
      headers: {
        ...formData.getHeaders(),
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    });
    
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Pinata upload error:', error.response?.data || error.message);
    throw new Error('Failed to upload to IPFS');
  }
};

const sendCertificateEmail = async (email, name, cid, course) => {
  try {
    if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
      console.warn('Mailgun credentials not configured. Skipping email sending.');
      return;
    }

    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: process.env.MAILGUN_API_URL || 'https://api.mailgun.net'
    });

    const data = {
      from: `EduNode <noreply@${process.env.MAILGUN_DOMAIN}>`,
      to: email,
      subject: `Your ${course} Certificate is Ready!`,
      text: `Hello ${name},\n\nYour certificate for ${course} is ready!\n\nView it here: https://ipfs.io/ipfs/${cid}\n\nBest regards,\nEduNode Team`,
      'h:Reply-To': 'support@edunode.org'
    };

    await mg.messages.create(process.env.MAILGUN_DOMAIN, data);
    console.log(`Certificate email sent to ${email}`);
  } catch (emailError) {
    console.warn('Failed to send email:', emailError.message);
    // Continue without failing the whole request
  }
};

const createNotification = async (email, message) => {
  const notification = new Notification({
    message,
    time: new Date(),
    email
  });
  return notification.save();
};

// Generic certificate creation handler
const createCertificate = async (req, res, certificateType) => {
  try {
    const { name, email, pkey } = req.body;
    const config = CERTIFICATE_CONFIGS[certificateType];
    
    if (!config) {
      return res.status(400).json({ error: 'Invalid certificate type' });
    }
    
    // Generate key pairs
    const keyPairs = generateKeyPairs();

    // Create diploma data
    const diplomaData = {
      student_name: name,
      email,
      course: config.course,
      institution: "EduNode",
      issue_date: new Date().toISOString().split('T')[0],
      certificate_id: keyPairs.publicKey // Using the public key as a unique ID
    };

    // Create diploma hash
    const diplomaHash = DiplomaUtils.createDiplomaHash(diplomaData);

    // Initialize the diploma NFT interaction
    const diplomaNFT = new DiplomaNFTInteraction(DIPLOMA_NFT_CONTRACT);

    try {
      // Check if contract is initialized
      const isInitialized = await diplomaNFT.isContractInitialized();
      if (!isInitialized) {
        throw new Error('Diploma NFT contract is not initialized');
      }

      // Mint the diploma NFT
      const tokenId = Date.now(); // Using timestamp as token ID
      const adminKeypair = DiplomaUtils.keypairFromSecret(process.env.ADMIN_SECRET_KEY);
      
      // Use the public key from the request body
      const recipientAddress = req.body.pkey;
      if (!recipientAddress) {
        throw new Error('Recipient public key (pkey) is required');
      }

      console.log('Minting NFT with recipient address:', recipientAddress);
      
      // Import Stellar SDK for address handling
      const StellarSdk = require('@stellar/stellar-sdk');
      
      try {
        // Convert the public key to a valid Stellar address
        const recipientKeypair = StellarSdk.Keypair.fromPublicKey(recipientAddress);
        
        await diplomaNFT.mintDiploma(
          adminKeypair,
          recipientKeypair.publicKey(), // Use the validated public key
          tokenId
        );
        
        console.log(`Successfully minted diploma NFT for ${email} with token ID: ${tokenId}`);
      } catch (error) {
        console.error('Error processing recipient address:', error);
        throw new Error('Invalid recipient public key. Please provide a valid Stellar public key starting with "G"');
      }
    } catch (nftError) {
      console.error('Error minting diploma NFT:', nftError);
      // Continue with the rest of the process even if NFT minting fails
    }

    // Hash secret keys
    const hashedIssuerSecretKey = await hashKeys(keyPairs.issuer.secret);
    const hashedDistributorSecretKey = await hashKeys(keyPairs.distributor.secret);
    
    // Create certificate record
    const newCertificate = new Certificate({
      name,
      email,
      pkey,
      cid: null,
      certificateNumber: generateCertificateNumber(),
      issuerSecretKey: hashedIssuerSecretKey,
      issuerPublicKey: keyPairs.issuer.public,
      distributorSecretKey: hashedDistributorSecretKey,
      distributorPublicKey: keyPairs.distributor.public,
      courseType: config.course
    });
    
    const savedCertificate = await newCertificate.save();
    
    // Create certificate image
    const imagePath = await createCertificateImage(config.template, name, config.message);
    
    // Upload to IPFS with retry logic
    const cid = await retry(
      async () => {
        return await uploadToPinata(imagePath);
      },
      {
        retries: 3,
        minTimeout: 1000,
        maxTimeout: 5000,
        onRetry: (error, attempt) => {
          console.log(`Upload attempt ${attempt} failed: ${error.message}`);
        }
      }
    );
    
    // Update certificate with CID
    savedCertificate.cid = cid;
    await savedCertificate.save();
    
    // Clean up temporary file
    try {
      await fs.unlink(imagePath);
    } catch (cleanupError) {
      console.warn('Failed to cleanup temporary file:', cleanupError);
    }
    
    // Send email notification (for diploma endpoint only)
    if (certificateType === 'diploma') {
      try {
        await sendCertificateEmail(email, name, cid, config.course);
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Don't fail the entire request if email fails
      }
    }
    
    // Create notification
    await createNotification(email, config.message);
    
    res.status(200).json({
      success: true,
      certificate: {
        id: savedCertificate._id,
        certificateNumber: savedCertificate.certificateNumber,
        cid: cid,
        course: config.course,
        ipfsUrl: `https://copper-deliberate-hippopotamus-402.mypinata.cloud/ipfs/${cid}`
      }
    });
    
  } catch (error) {
    console.error('Error in createCertificate:', error);
    return res.status(500).json({ error: 'Failed to create certificate', details: error.message });
  }
};

// Certificate generation endpoints with rate limiting
Object.keys(CERTIFICATE_CONFIGS).forEach(certType => {
  router.post(`/${certType}`, certificateLimit, validateCertificateInput, (req, res) => {
    createCertificate(req, res, certType);
  });
});

// GET endpoints with improved error handling and security
router.get('/certificateNumber/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const certificates = await Certificate.find({ email }, 'certificateNumber').lean();
    const certificateNumbers = certificates.map(cert => cert.certificateNumber);
    
    res.json(certificateNumbers);
  } catch (error) {
    console.error('Error fetching certificate numbers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const certificates = await Certificate.find({ email }).lean();
    const certificateData = certificates.map(cert => ({
      certificateNumber: cert.certificateNumber,
      issuerPublicKey: cert.issuerPublicKey,
      distributorPublicKey: cert.distributorPublicKey,
      cid: `https://copper-deliberate-hippopotamus-402.mypinata.cloud/ipfs/${cert.cid}`,
      course: cert.courseType,
      createdAt: cert.createdAt
    }));
    
    res.json(certificateData);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/cert/:certificateNumber', async (req, res) => {
  try {
    const certificateNumber = parseInt(req.params.certificateNumber);
    
    if (!certificateNumber || certificateNumber <= 0) {
      return res.status(400).json({ error: 'Invalid certificate number' });
    }
    
    const certificate = await Certificate.findOne({ certificateNumber }).lean();
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    // Remove sensitive data before sending response
    const { issuerSecretKey, distributorSecretKey, ...safeCertificate } = certificate;
    
    res.json(safeCertificate);
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Trophy and notification endpoints
router.put('/increment-trophy', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.CoursesTrophy = (user.CoursesTrophy || 0) + 1;
    await user.save();
    
    await createNotification(email, 'Congrats! You have a new Course Badge for finishing a Course!');
    
    res.json({ success: true, message: 'Trophy incremented successfully' });
  } catch (error) {
    console.error('Error incrementing trophy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/challenge/increment-Challenge', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    user.ChallengesTrophy = (user.ChallengesTrophy || 0) + 1;
    await user.save();
    
    await createNotification(email, 'Congrats! You have a new Challenge Badge for finishing a Challenge!');
    
    res.json({ success: true, message: 'Challenge trophy incremented successfully' });
  } catch (error) {
    console.error('Error incrementing challenge trophy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notification endpoints
router.get('/notification/:email', async (req, res) => {
  try {
    const email = req.params.email;
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const notifications = await Notification.find({ email }).sort({ time: -1 }).lean();
    
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Valid certificates endpoint
router.post('/validCertificate', async (req, res) => {
  try {
    const { name, url, email, university, image } = req.body;
    
    if (!name || !url || !email || !university) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (!isValidURL(url)) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    const validCertificate = new ValidCertificates({
      name: sanitizeString(name),
      url,
      university: sanitizeString(university),
      email,
      image
    });
    
    await validCertificate.save();
    res.status(201).json({ success: true, certificate: validCertificate });
  } catch (error) {
    console.error('Error creating valid certificate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/valid', async (req, res) => {
  try {
    const certificates = await ValidCertificates.find().lean();
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching valid certificates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Router error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = router;