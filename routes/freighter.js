const express = require("express");
const router = express.Router();
const cors = require('cors');
const FreighterUser = require('../models/FreighterUser');
app.use(cors());
router.post("/", async (req, res, next) => {

  // console.log("newUser")

    res.setHeader('Access-Control-Allow-Origin', '*');
    // validation 1
   const { pkey } = req.body;

    const newUser = {
       pkey
    }
  
    try {
      let user = await FreighterUser.findOne({ pkey: pkey })
      if (user) {
  
        res.send({
          user: {
            // granted: true,
            pkey: user.pkey,
            
          }
        });
      } else {
        user = await FreighterUser.create(newUser)

        res.send({
          user: {
            pkey: user.pkey,


          }
        });
  
      }
  
    } catch (err) {
      console.error(err)
    }
    next()
  });



  module.exports = router;