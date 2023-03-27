const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/", async (req, res, next) => {
  console.log(req.body)
  res.setHeader("Access-Control-Allow-Origin", '*');
  res.setHeader('Content-Type', 'application/json');
// , {sparse: true }
await User.findOne({ email: req.body.email }) 
.then((user) => {
  if(user){
  const confirmationCode = user.confirmationCode
  const inputcode = req.body.inputcode
if(confirmationCode === inputcode){
  user.isVerified = true
    user.save()
     console.log("they match", user)
     res.send({
      user,
      isVerified: true,
      message: "Valid Code",
    }); 
} else {
  res.send({
    user,
    isVerified: false,
    message: "No Valid Code",
  }); 
  console.log("no match", user)

}
}

  }).catch((err) => {console.log(err)});
  next();
});

module.exports = router;
