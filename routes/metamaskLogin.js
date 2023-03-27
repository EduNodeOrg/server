const express = require("express");
const router = express.Router();
const MetamaskUser = require('../models/MetamaskUser');


router.post('/', async (req, res, next) => {
res.header("Access-Control-Allow-Origin", '*');
res.header('Content-Type', 'application/json');
const accounts = req.body.accounts
const pubkey = req.body.accounts[0]
const isVerified = true
try {
  let user = await MetamaskUser.findOne({ pubkey: pubkey })
  if (user) {
    res.send({
      user
    });
  } else {
    const pubkey = req.body.accounts[0]
    
    const newUser = {
      pubkey, isVerified
     }
    user = await MetamaskUser.create(newUser)

    res.send({
      user

    });

  }

} catch (err) {
  console.error(err)
}
next()

// .catch((err) => {console.log(err)});
})

  module.exports = router;