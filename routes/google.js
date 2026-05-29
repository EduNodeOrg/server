const express = require("express");
const router = express.Router();
const User = require('../models/User');
const jwt = require("jsonwebtoken");
const mg = require('../utils/mailgunClient');
const session = require('express-session');

// Removed CORS setup from this file. It will be handled in server.js

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
          id: user._id,
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
        mg.messages.create(process.env.MAILGUN_DOMAIN || 'edunode.org', data, function (error, body) {
          if (error) {
            console.log('Error sending email:', error.message || error);
            // Don't crash the server, just log the error
          } else {
            console.log('Email sent successfully:', body);
          }
        });

        // Generate JWT token for existing user
        jwt.sign(
          { id: user._id }, process.env.JWT_SECRET,
          { expiresIn: 3600 },
          (err, token) => {
            if (err) throw err;
            res.json({
              token,
              user,
              msg: "User already exists, welcome back"
            });
          }
        );





      } else {
        const confirmationCode = Math.floor(Math.random() * 90000) + 10000;
        const newUser = new User({ email, name, confirmationCode, images });
        newUser.save()
          .then(() => {

            const sessionUser = {
              id: newUser._id,
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
            mg.messages.create(process.env.MAILGUN_DOMAIN || 'edunode.org', data, function (error, body) {
              if (error) {
                console.log('Error sending email:', error.message || error);
                // Don't crash the server, just log the error
              } else {
                console.log('Email sent successfully:', body);
              }
            });

            // Generate JWT token and send it in response
            jwt.sign(
              { id: newUser._id }, process.env.JWT_SECRET,
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