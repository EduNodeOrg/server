const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth"); // jtw handler

// Load User model
const User = require('../models/User');

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

//@route POST  api/auth
router.post("/", async (req, res) => {  
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Content-Type', 'application/json');
  // res.header("Access-Control-Allow-Credentials", true);
  // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  // res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  // res.header('Content-Type', 'application/json');

  // validation 1
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields"})
   }

   
// validation 2 - check for existing email
await User.findOne({ email })
.then(async (user) => {
  console.log(user)
  try {
    if(!user) return res.status(400).json({ msg: "E-mail is not registered"});
    if (user.email && user.password) {
      console.log(user.password)
      console.log(req.body.password)
      // const salt = await bcrypt.genSalt(10)
      // const hashPassword =  await bcrypt.hash(req.body.password, salt)
      // console.log(hashPassword)
      await bcrypt.compare(req.body.password, user.password).then(isMatch => {

        console.log(isMatch)
 
try {
          if(isMatch){
                 // JWT signature
jwt.sign(
        { id: user.id}, process.env.JWT_SECRET,
        { expiresIn: 3600 },
        (err, token) => {
          if (err) throw err;
          res.statusCode(200).json({
            token,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              isVerified: user.isVerified,
              userName: user.userName,
              courseOneDone: user.courseOneDone,
              pkey: user.pkey,
            }
            
          })
        }
      )
      console.log("hi")
          }
          if (!isMatch) return res.status(400).json({ msg: "Invalid credentials, please check your input."})
         
        } catch (error) {
          console.log(error)
          
        }
       
      })
      
 
     
      
    } else {
      
    }
    
  } catch (error) {
    console.log(error)
  }
  

// validation 3 password




});

});


module.exports = router;
