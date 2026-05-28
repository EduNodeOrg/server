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
  res.header('Content-Type', 'application/json');
  try {
    const { email, name, age, bio, location,images,university } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { email }, // search query
      { name, age, bio, location,images,university }, // new user data
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
