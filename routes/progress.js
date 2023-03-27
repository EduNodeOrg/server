const express = require("express");
const router = express.Router();
// const nodemailer = require("nodemailer");
const User = require("../models/User");
const dotenv = require("dotenv");

router.post("/", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  User.findOne({ email: req.body.email })

    .then((user) => {
      const confirmationCode = user.confirmationCode;
      if (user) {
        main(confirmationCode);
        console.log("email sent");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

module.exports = router;
