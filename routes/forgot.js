  const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require('../models/User');
const dotenv = require('dotenv');

router.post("/", async (req, res, next) => {
  try {
    const user = await User.findOne({email: req.body.email});
    
    if(user) {
      const id = user._id;
      const request = {
        id,
        email: req.body.email
      };
      
      let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          type: "login",
          user: process.env.EDUNODE_GMAIL_EMAIL,
          pass: process.env.EDUNODE_GMAIL_PASS
        }
      });
      
      let emailInfo = {
        from: '"EduNode" <edunodeapp@gmail.com>',
        to: request.email,
        subject: "Reset Password",
        text: "Reset Password :)",
        html: `Please click here to reset your password: <b>https://edunode.org/reset/${id}</b>`
      };
      
      let info = await transporter.sendMail(emailInfo);
      console.log("Message sent: %s", info.messageId);
      
      res.json({  
        msg: "email sent",
      });
    } else {
      res.json({
        msg: "If an account with that email exists, a password reset link has been sent."
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
});







module.exports = router;