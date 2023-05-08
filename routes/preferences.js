const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.post('/preferences', (req, res) => {
  const { email, preferences } = req.body;

  // Find the user by email and update their preferences
  User.findOneAndUpdate(
    { email },
    { preferences },
    { new: true },
    (err, user) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        res.json({ message: 'Preferences updated successfully' });
      }
    }
  );
});

module.exports = router;
