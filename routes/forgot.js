  const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require('../models/User');
const dotenv = require('dotenv');

router.post("/", (req, res, next) => {

User.findOne({email: req.body.email})
.then(user => {
  
  if(user) {
    const id = user._id
    const request = {
      id,
      email: req.body.email
    }
    main(request)
  }}).catch(err => {
  console.log(err)
})
  

async function main(request) {
      let transporter = nodemailer.createTransport({
       host: "smtp.gmail.com",
       port: 465,
       secure: true, // true for 465, false for other ports
       auth: {
         type: "login",
         user: process.env.EDUNODE_GMAIL_EMAIL,
         pass: process.env.EDUNODE_GMAIL_PASS
       }
      });
      
    // let email = req.body.email
    // const confirmationCode = user.confirmationCode
      
      let emailInfo = {
       from: '"EduNode" <edunodeapp@gmail.com>', // sender address
       to: request.email, // list of receivers
       subject: "Reset Password", // Subject line
       text: "Reset Password :)", // plain text body
       html: `Please click here to reset your password: <b>http://localhost:3000/reset/${id}</b>` 
      }
      
      
      let info = await transporter.sendMail(emailInfo);
      
       
      // send mail with defined transport object
      
      
      console.log("Message sent: %s", info.messageId);

      
      res.json({  
        msg: "email sent",
 
      })

       
    }
  
 
}

 ); 






module.exports = router;