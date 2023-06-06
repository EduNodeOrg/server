const express = require("express");
const router = express.Router();
const User = require('../models/User');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"


const mg = mailgun.client({username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net'});




router.post("/", async (req, res) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
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
      
      
      mg.messages.create(domain, data, function (error, body) {
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






{/*async function main(confirmationCode) {
  console.log("hello email")
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    //host: "smtp.ethereal.email",
    //port: 587,
    service:'gmail',
    secure: false,
    auth: {
      user: "edunodeapp@gmail.com",
      pass: "8vODdS4s83Ml" ,
    },
  });

  let info = await transporter.sendMail({
    from: 'edunodeapp@gmail.com',
    to: "sarah@ogtechnologies.co",
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
} */}

module.exports = router;


