const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

router.post('/', function (req, res) {
   res.header("Access-Control-Allow-Origin", '*');
   res.header("Access-Control-Allow-Credentials", true);
   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
   res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
   res.header('Content-Type', 'application/json');
const email = req.body.email
console.log(email)
User.findOne({ email })
.then((user) => {
if (user) return res.status(200).json({ user, msg: "User already exists, welcome back" });
    
         //     // validation 1
// const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
const password = req.body.password
const email = req.body.email
      
User.findOne({ email })
  .then((user) => {
    if (!user) return res.status(401).json({ msg: "Invalid email or password" });
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) throw err;
      if (isMatch) {
        jwt.sign(
          { id: user.id }, process.env.JWT_SECRET,
          { expiresIn: 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({
              token,
              user: {
                id: user._id,
                email: user.email,
                confirmationCode: user.confirmationCode
              },
            });
          }
        );
      } else {
        return res.status(401).json({ msg: "Invalid email or password" });
      }
    });
  })
  .catch((err) => {console.log(err)});

}).catch((err) => {console.log(err)});
})





  module.exports = router;