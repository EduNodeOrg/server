const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

// Route to handle updating the user's profile information
router.post('/', async (req, res) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');
  try {
    const { _id, name, age, bio, location } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      _id, // user id to update
      { name, age, bio, location }, // new user data
      { new: true, runValidators: true } // options
    );

    // Handle the updated user
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
