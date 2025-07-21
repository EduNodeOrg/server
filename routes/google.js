const express = require("express");
const router = express.Router();
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });
const session = require('express-session');

router.post('/', function (req, res) {
 // res.header("Access-Control-Allow-Origin", '*');
 // res.header("Access-Control-Allow-Credentials", true);
 // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
 // res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
 // res.header('Content-Type', 'application/json');

  const email = req.body.email;
  const name = req.body.name;
  const images = req.body.image;
  console.log(email);

  User.findOne({ email })
    .then((user) => {
      if (user) {
        // Store user data in the session
        const sessionUser = {
          name: name,
          email: req.body.email,
        };
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


        res.json({ user, msg: "User already exists, welcome back" });





      } else {
        const confirmationCode = Math.floor(Math.random() * 90000) + 10000;
        const newUser = new User({ email, name, confirmationCode, images });
        newUser.save()
          .then(() => {

            const sessionUser = {
              name: name,
              email: req.body.email,
            };
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

            // Generate JWT token and send it in response
            jwt.sign(
              { id: newUser.id }, process.env.JWT_SECRET,
              { expiresIn: 3600 },
              (err, token) => {
                if (err) throw err;
                res.json({
                  token,
                  newUser,
                  user: {
                    id: newUser._id,
                    email: newUser.email,
                    name: newUser.name,
                    confirmationCode: newUser.confirmationCode,
                    images: newUser.images
                  },
                });
              }
            );
          })
          .catch((err) => {
            console.log(err);
            res.status(500).json({ msg: "An error occurred while creating user" });
          });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ msg: "An error occurred while checking email" });
    });
});


module.exports = router;