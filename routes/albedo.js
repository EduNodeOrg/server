const express = require("express");
const router = express.Router();
const AlbedoUser = require('../models/Albedo');

router.post("/", async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, application/json');

    // validation 1
   const { intent, pubkey, signature, signed_message } = req.body;

    const newUser = {
       intent, pubkey, signature, signed_message
    }

    if (!pubkey) {
    return res.status(400).json({ msg: "Permission not granted" })
     }
  
    try {
      let user = await AlbedoUser.findOne({ pubkey: pubkey })
      if (user) {
  
        res.send({
          user: {
            granted: true,
            intent: user.intent,
            pubkey: user.pubkey,
            userName: user.userName,
            signature: user.signature,
            signed_message: user.signed_message,
            
          }
        });
      } else {
        user = await AlbedoUser.create(newUser)
  
        res.send({
          user: {
            granted: true,
            intent: user.intent,
            pubkey: user.pubkey,
            signature: user.signature,
            signed_message: user.signed_message,
            userName: user.userName
          }
        });
  
      }
  
    } catch (err) {
      console.error(err)
    }
    next()
  });



  // put albedo userName

  router.put("/username", async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, application/json');
    // validation 1
   const { pubkey, userName } = req.body;


    // if (!pkey) {
    // return res.status(400).json({ msg: "Permission not granted" })
    //  }
 
   AlbedoUser.updateOne( { "pubkey": pubkey }, {$set : {"userName": userName }}).then(() => {
    res.send({

      name: userName,

    });
    
  }
  )
  .catch(err => res.status(400).json("Error: " + err));
 
     
  });



  module.exports = router;