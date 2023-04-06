const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, 
  { useNewUrlParser: true, 
    useUnifiedTopology: true, 
    useFindAndModify: false });

// Route to handle updating the user's profile information
router.post('/', async (req, res) => {
    res.header("Access-Control-Allow-Origin", '*');
    res.header("Access-Control-Allow-Credentials", true);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
    res.header('Content-Type', 'application/json');
  try {
    const { name, age, bio, location } = req.body;
    const user = await User.findOneAndUpdate({ email: req.email }, { name, age, bio, location }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error'); 
  }
}); 

module.exports = router;
