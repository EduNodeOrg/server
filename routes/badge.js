const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');

// POST route to add a new badge
router.post('/add', async (req, res) => {
  try {
    const badgeData = req.body;
    const badge = new Badge(badgeData);
    await badge.save();
    res.status(201).json({ message: 'Badge added successfully' });
  } catch (error) {
    console.error('Error adding badge:', error);
    res.status(500).json({ message: 'Failed to add badge' });
  }
});



module.exports = router;
