const express = require('express');
const router = express.Router();

router.get("/", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    const articles = [{
        title: "test article",
        createdAt: Date.now(),
        description: "test description"
    }]

    // res.header("Access-Control-Allow-Origin", '*');
    // res.header("Access-Control-Allow-Credentials", true);
    // res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    // res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    // res.header('Content-Type', 'application/json');
  const email = req.body.email
  
  User.findOne({ email })
  .then((user) => {
  if (user) return res.status(400).json({ msg: "User already exists" });
      
           //     // validation 1
  const confirmationCode = JSON.stringify(Math.floor(Math.random() * 90000) + 10000)
  const password = JSON.stringify(req.body.password)
  const email = req.body.email
        
  const newUser = {email, password, confirmationCode,};
         // create salt and hash
  
  bcrypt.genSalt(10, (err, salt) => {
  bcrypt.hash(newUser.password, salt, (err, hash) => {
  // if (err) throw err;
  newUser.password = hash;
  // store to mongodb .then(console.log("saved to mongodb"))
  User.create(newUser).then(console.log("saved to mongodb"))
  .then((user) => {
              jwt.sign(
              { id: user.id }, process.env.JWT_SECRET,
              { expiresIn: 3600 },
              (err, token) => {
                 if (err) throw err;
                res.json({
                  token,
                  // confirmationCode,
                  user: {
                    id: user._id,
                    email: user.email,
                  },
               
                });
                // res.redirect('http://localhost:3000/dashboard');
      
              }
              
            );
          })})
          })
  
  }).catch((err) => {console.log(err)});



})

module.exports = router;