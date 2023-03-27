const express = require('express');
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require('../models/User');
const mailjet = require("node-mailjet").connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);


router.post("/", (req, res) => {

User.findOne({email: req.body.email})
  .then(user => {
   const confirmationCode = user.confirmationCode;
  if(user) {
    main(confirmationCode);
  }}).catch(err => {
  console.log(err)
})
  

  async function main(confirmationCode) {
  
// const mailjet = require("node-mailjet").connect(
//   process.env.MJ_APIKEY_PUBLIC,
//   process.env.MJ_APIKEY_PRIVATE
// );
  let emailUser = req.body.email;
    const request = mailjet.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "hi@edunode.org",
            Name: "EduNode Team",
          },
          To: [
            {
              Email: emailUser,
              Name: "name",
            },
          ],
          Subject: "Your confirmation code",
          TextPart:
            "Dear passenger 1, welcome to Mailjet! May the delivery force be with you!",
          HTMLPart: `Hello ${emailUser}, this is your confirmation code: ${confirmationCode}`,
        },
      ],
    });
    
request
  .then((result) => {
    console.log(result.body);
    // console.log(result.statusCode);
  })
  .catch((err) => {
    console.log(err.statusCode);
  });

      // const confirmationCode = user.confirmationCode;

//       var api_key = "e70a2ef570c17eab1ca181cd794a6cd2-4de08e90-176e94c6";
//       var domain = "sandbox4b18d24c6a764880ab781c91a6445ad0.mailgun.org";
//       var mailgun = require("mailgun-js")({ apiKey: api_key, domain: domain });
// var toString = String.valueOf(email);
//       var data = {
//         from: "EduNode Team <hi@edunode.org>",
//         to: "olvisgil@experio.at",
//         subject: "Hello",
//         text: `This is your confirmation code: <b>${confirmationCode}</b>`,
//       };

  // mailgun.messages().send(data, function (error, body) {
    
  //       console.log(body);
  //     });
  // console.log(process.env.EDUNODE_GMAIL_EMAIL)
      // let transporter = nodemailer.createTransport({
      //  host: "smtp.gmail.com",
      //  port: 465,
      //  secure: true, // true for 465, false for other ports
      //  auth: {
      //   user: process.env.EDUNODE_GMAIL_EMAIL,
      //   pass: process.env.EDUNODE_GMAIL_PASS 
      //  }
      // });
        
      
     

    // let email = req.body.email
    // const confirmationCode = user.confirmationCode
      
      // let emailInfo = {
      //  from: '"EduNode" <no-reply@edunode.org>', // sender address
      //  to: email, // list of receivers
      //  subject: "Confirmation Email ✔", // Subject line
      //  text: "Confirmation Email :)", // plain text body
      //  html: `This is your confirmation code: <b>${confirmationCode}</b>` 
      // }
      
      
      // let info = await transporter.sendMail(emailInfo);
      
       
      // send mail with defined transport object
      
      
      // console.log("Message sent: %s", info.messageId);

      
      res.json({  
        msg: "email sent",
      })

       
    }
  
 
}

 ); 






module.exports = router;