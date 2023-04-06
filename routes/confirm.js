const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require('../models/User');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"


const mg = mailgun.client({username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net'});




router.post("/", async (req, res) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);

  try {
    const user = await User.findOne({email: req.body.email});
    const confirmationCode = user.confirmationCode;
    if (user) {
      const data = {
        from: 'hi@edunode.org',
        to: req.body.email ,
        subject: 'Edunode Confirmation Code',
        text: `Hello! Your confirmation code is: ${confirmationCode}`
      };
      
      mg.messages.create(domain, data);
      mg.messages.create(data, function (error, body) {
        if (error) {
          console.log('Error sending email:', error);
          res.status(500).json({ error: 'Error sending email' });
        } else {
          console.log('Email sent successfully:', body);
          res.json({ msg: 'Email sent' });
        }
      });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.log(err);
  }
});



module.exports = router;


