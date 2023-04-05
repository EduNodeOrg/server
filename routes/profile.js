const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to handle updating the user's profile information
router.post('/', async (req, res) => {
  try {
    const { name, age, bio, location } = req.body;
    const user = await User.findOneAndUpdate({ email: req.user.email }, { name, age, bio, location }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
