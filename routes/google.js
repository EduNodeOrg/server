const express = require("express");
const router = express.Router();
const User = require('../models/User');



router.post('/', function (req, res) {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    res.header('Content-Type', 'application/json');
  
    const email = req.body.email;
    const name = req.body.name;
    console.log(email);
  
    User.findOne({ email })
      .then((user) => {
        if (user) {
          return res.status(200).json({ user, msg: "User already exists, welcome back" });
        } else {
          const confirmationCode = Math.floor(Math.random() * 90000) + 10000;
          const newUser = new User({ email,name, confirmationCode });
          newUser.save()
            .then(() => {
              res.status(201).json({ msg: "User created successfully" });
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