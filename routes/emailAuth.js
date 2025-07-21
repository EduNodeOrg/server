const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const { authorize } = require('../models/User');
const auth = require('../middleware/auth');

const mg = mailgun.client({username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net'});


router.post('/', function (req, res) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
  
  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;
  User.findOne({ email })
    .then((user) => {
      if (user) {
        // If the user exists, throw an error
        res.status(403).json({ msg: "Email already exists, please log in" });
      } else {
        // If the user doesn't exist, create a new user
        const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
        const newUser = { email,name ,password, confirmationCode };
        const data = {
          from: 'hi@edunode.org',
          to: req.body.email ,
          subject: 'Edunode Confirmation Code',
          text: `Hello! Your confirmation code is: ${confirmationCode}`
        };
        
        mg.messages.create(domain, data, function (error, body) {
        if (error) {
          console.log('Error sending email:', error);
          res.status(500).json({ error: 'Error sending email' });
        } else {
          console.log('Email sent successfully:', body);
          res.json({ msg: 'Email sent' });
        }
      });
      
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
                      name: user.name,
                      id: user._id,
                      email: user.email,
                      confirmationCode: user.confirmationCode,
                      images:user.images,
                      preferences:user.preferences,
                      role: user.role,
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

// Protect admin-only routes
router.get("/admin/users", auth, authorize('admin'), async (req, res) => {
  // Get all users logic
});

module.exports = router;