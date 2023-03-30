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
  
  const email = req.body.email;
  const password = req.body.password;
  
  User.findOne({ email })
    .then((user) => {
      if (user) {
        // If the user exists, check if the password is correct
        bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) throw err;
          if (isMatch) {
            // If the password is correct, generate a JWT and send it back to the client
            jwt.sign(
              { id: user.id },
              process.env.JWT_SECRET,
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
                  msg: "User already exists, welcome back"
                });
              }
            );
          } else {
            // If the password is incorrect, send an error message to the client
            res.status(401).json({ msg: "Invalid credentials" });
          }
        });
      } else {
        // If the user doesn't exist, create a new user
        const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
        const newUser = { email, password, confirmationCode };
        
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            User.create(newUser).then((user) => {
              // If the user is created successfully, generate a JWT and send it back to the client
              jwt.sign(
                { id: user.id },
                process.env.JWT_SECRET,
                { expiresIn: 3600 },
                (err, token) => {
                  if (err) throw err;
                  res.json({
                    token,
                    user: {
                      id: user._id,
                      email: user.email,
                      confirmationCode: user.confirmationCode
                    }
                  });
                }
              );
            }).catch((err) => {
              console.log(err);
              res.status(500).json({ msg: "Internal server error" });
            });
          });
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: "Internal server error" });
    });
});

module.exports = router;
