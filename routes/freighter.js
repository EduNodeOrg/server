const express = require("express");
const router = express.Router();
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const { use } = require("passport");
router.post("/", async (req, res, next) => {

   console.log("newUser")

    res.setHeader('Access-Control-Allow-Origin', '*');
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
              token,
          user: {
            id: user._id,
            pkey: user.pkey,
            email: user.email,
            name:user.name,
            age:user.age,
            bio:user.bio,
            location:user.location,
            preferences:user.preferences

          }
        });
       } );
      } else {
        user = await User.create(newUser)

        jwt.sign(
          { id: user.id }, process.env.JWT_SECRET,
          { expiresIn: 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({
              token,
          user: {
            id: user._id,
            pkey: user.pkey,
            email: user.email,
            name:user.name,
            age:user.age,
            bio:user.bio,
            location:user.location,
            preferences:user.preferences
          }
        });
       } );
  
      }
  
    } catch (err) {
      console.error(err)
    }
    next()
  });



  module.exports = router;