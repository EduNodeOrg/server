const express = require("express");
const router = express.Router();
const WebThreeUser = require('../models/WebThreeAuth');

router.post("/", async (req, res, next) => {
  console.log(req.body)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // validation 1
   const { id, className } = req.body;

    const newUser = {
       id, className
    }
  
    try {
      let user = await WebThreeUser.findOne({ id: id })
      if (user) {
  
        res.send({
          user: {
            // granted: true,
            id: user.id,
            className: user.className,            
          }
        });
      } else {
        user = await WebThreeUser.create(newUser)

        res.send({
          user: {
            id: user.id,
            className: user.className,

          }
        });
  
      }
  
    } catch (err) {
      console.error(err)
    }
    next()
  });



  module.exports = router;