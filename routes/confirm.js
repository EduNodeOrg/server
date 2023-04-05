{/*const express = require('express');
const router = express.Router();
const User = require('../models/User');
{/*const mailjet = require("node-mailjet").connect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);


router.post("/", async (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');

  const email = {email: req.body.email}
  try {
    await User.findOne(email)
    .then(async (user) => {
      if (user) {

 {/*function main(confirmationCode) {
          const emailUser = req.body.email
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
                    "Welcome to EduNode! May the learning force be with you!",
                  HTMLPart: `Hello ${emailUser}, this is your confirmation code: ${confirmationCode}`,
                },
              ],
            });
            request
              .then((result) => {
               
                // console.log(result.body);
                console.log(result.body);
              })
              .catch((err) => {
                console.log(err);
              });
             
          }
          main(user.confirmationCode);
        console.log("email sent");

        

      } else (err) => {
        console.log(err)
     
      }
res.json(user)
    })
    .catch((err) => {
      console.log(err);
    });

 
    
  } catch (error) {
    console.log(error)
  }


  next()
}
); 

  module.exports = router;
*/}

