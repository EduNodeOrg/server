const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");

router.post('/', function (req, res) {
  res.header("Access-Control-Allow-Origin", '*');
  // res.header("Access-Control-Allow-Credentials", true);
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
const email = req.body.email
console.log(email)
User.findOne({ email })
.then((user) => {
if (user) return res.status(400).json({ user, msg: "User already exists, welcome back" });
    
         //     // validation 1
const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
const password = req.body.password
const email = req.body.email
      
const newUser = {email, password, confirmationCode,};
       // create salt and hash

bcrypt.genSalt(10, (err, salt) => {
bcrypt.hash(newUser.password, salt, (err, hash) => {
// if (err) throw err;
newUser.password = hash;
// store to mongodb .then(console.log("saved to mongodb"))
User.create(newUser).then(console.log("saved to mongodb"))
.then((user) => {
            jwt.sign(
            { id: user.id }, process.env.JWT_SECRET,
            { expiresIn: 3600 },
            (err, token) => {
               if (err) throw err;
              res.json({
                token,
                // confirmationCode,
                user: {
                  id: user._id,
                  email: user.email,
                  confirmationCode: user.confirmationCode
                },
             
              });
              // res.redirect('http://localhost:3000/dashboard');
    
            }
            
          );
        })})
        })

}).catch((err) => {console.log(err)});
})

  module.exports = router;