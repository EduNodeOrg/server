const express = require("express");
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const passport = require('passport');
const cookieSession = require('cookie-session');
//const sgMail = require('@sendgrid/mail');
//const crypto = require('crypto');
//sgMail.setApiKey('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');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });
const session = require('express-session');




router.post('/', function (req, res) {
  // Removed manual CORS headers; handled by global middleware
  // res.header("Access-Control-Allow-Origin", '*');
  // res.header("Access-Control-Allow-Credentials", true);
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  // res.header('Content-Type', 'application/json');

  const email = req.body.email
  console.log(email)
  User.findOne({ email })
    .then((user) => {
      // if (user) return res.status(200).json({ user, msg: "User already exists, welcome back" });

      //     // validation 1
      // const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
      const password = req.body.password
      const email = req.body.email
      console.log('login')
      User.findOne({ email })
        .then((user) => {
          if (!user) return res.status(401).json({ msg: "Invalid email or password" });
          bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;
            if (isMatch) {

              // Register session
              const sessionUser = {
                id: user.id,
                email: req.body.email,
              };

              // Store user data in the session
              req.session.user = sessionUser;

              // Send email notification
              const data = {
                from: 'hi@edunode.org',
                to: email,
                subject: 'Welcome to Edunode ',
                text: `Hello! Your have logged in to edunode!`
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



              jwt.sign(
                { id: user.id }, process.env.JWT_SECRET,
                { expiresIn: 3600 },
                (err, token) => {
                  if (err) throw err;
                  res.json({
                    token,
                    user
                  });
                }
              );



            } else {
              return res.status(401).json({ msg: "Invalid email or password" });
            }
          });
        })
        .catch((err) => { console.log(err) });

    }).catch((err) => { console.log(err) });
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