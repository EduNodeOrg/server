const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');


// Fetch badges data
router.get('/', async (req, res) => {
  try {
    const badgeData = await Badge.find();
    res.json(badgeData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
      await Badge.findByIdAndRemove(id);
      res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
      console.error('Error deleting Badge:', error);
      res.status(500).json({ error: 'Failed to delete Badge' });
  }
});

router.put('/edit/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const glossary = await Badge.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    res.json(glossary);
  } catch (error) {
    console.error('Error updating Badge:', error);
    res.status(500).json({ error: 'Failed to update Badge' });
  }
});

router.get('/posted/:email', async (req, res) => {
  const {email} = req.params;

  try {
    const badges = await Badge.find({ email:email });
    res.json(badges);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
