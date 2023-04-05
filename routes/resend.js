const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const User = require('../models/User');

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
      await main(confirmationCode);
      res.json({  
        msg: "email sent",
      })
    }
  } catch (err) {
    console.log(err);
  }
});

async function main(confirmationCode) {
  let testAccount = await nodemailer.createTestAccount();
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to: "sarah@ogtechnologies.co, baz@example.com",
    subject: "Hello ✔",
    text: "Hello world?",
    html: "<b>Hello world?</b>",
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

module.exports = router;


{/*async function main(confirmationCode, req) {
  mailjet = require("node-mailjet").connect(
    process.env.MJ_APIKEY_PUBLIC,
    process.env.MJ_APIKEY_PRIVATE
  );
  const emailUser = req.body.email;
  const request = mailjet.post("send", { version: "v3.1" }).request({
    "Messages":[
      {
        "From": {
          "Email": "hi@edunode.org",
          "Name": "EduNode Team",
        },
        "To": [
          {
            "Email": emailUser,
            "Name": "ogTechnologies",
          },
        ],
        "Subject": "Your confirmation code",
        "TextPart":
          "Dear passenger 1, welcome to Mailjet! May the delivery force be with you!",
          "HTMLPart": `
          <html>
            <body>
              Hello ${emailUser}, ${
          confirmationCode
            ? `this is your confirmation code: ${confirmationCode}`
            : "an error occurred while retrieving your confirmation code"
        }
            </body>
          </html>
        `,
        "CustomID": "AppGettingStartedTest"
      },
    ],
  })
  request
  .then((result) => {
    console.log(result.body)
  })
  .catch((err) => {
    console.log(err.statusCode)
  })

  try {
    const result = await request;
    console.log(result.body);
    res.json({
      msg: "email sent",
    });
  } catch (err) {
    console.log(err.statusCode);
  }
}
*/}





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


     