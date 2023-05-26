const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const {OAuth2Client} = require('google-auth-library');
const passport =require('passport');
const cookieSession =require('cookie-session');
router.post('/', function (req, res) {
   res.header("Access-Control-Allow-Origin", '*');
   res.header("Access-Control-Allow-Origin", 'https://edunode.org');
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


router.get('/user/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return the user information
    res.json(user);
  } catch (err) {
    // Handle any errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/*
const clientId = "249576166536-ctede4ekn8eipj22eucggedpbpirg6dc.apps.googleusercontent.com";
const client = new OAuth2Client(clientId);
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URL
);

router.get('/auth/google/url', (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes
  });

  res.json({ url });
});

router.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Now you can use 'oauth2Client' to make requests.
    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userInfo = await oauth2.userinfo.get();

    // Handle or send 'userInfo.data' as you wish.
    res.json(userInfo.data);
    console.log(userInfo.data)
  } catch (error) {
    res.status(400).json({ error: 'Error trying to get user info' });
  }
});
*/




  module.exports = router;