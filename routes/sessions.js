const express = require('express');
const router = express.Router();

const Session = require('../models/Session');

// Register and login google user

router.post("/", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // validation 1
    const { email, googleId, pubkey } = req.body;
    const newSession = {
      email, pubkey, googleId
    }

try {

    user = await Session.create(newSession)
  
    } catch (err) {
      console.error(err)
    }
   
  });