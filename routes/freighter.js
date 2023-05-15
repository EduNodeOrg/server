const express = require("express");
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
router.post("/", async (req, res, next) => {

  console.log("newUser")

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
  // validation 1
  const { pkey } = req.body;

  // Generate a random email using crypto module
  const pkeyEmail = pkey + '@edunode.org'

  const newUser = {
    pkey,
    email: pkeyEmail
  }

  try {
    let user = await User.findOne({ pkey: pkey })
    if (user) {
      jwt.sign(
        { id: user.id }, process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({
        user: {
          // granted: true,
          pkey: user.pkey,
          email: user.email,
        }
      });
    });
    } else {
      user = await User.create(newUser)

      jwt.sign(
        { id: user.id }, process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.json({
        user: {
          // granted: true,
          pkey: user.pkey,
          email: user.email,
        }
      });
    });

    }

  } catch (err) {
    console.error(err)
  }
  next()
});



module.exports = router;