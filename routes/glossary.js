const express = require('express');
const router = express.Router();
const GlossaryEntry = require('../models/GlossaryEntry');

// Fetch glossary data
router.get('/', async (req, res) => {
  try {
    const glossaryData = await GlossaryEntry.find();
    res.json(glossaryData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Store glossary data
router.post('/', async (req, res) => {
  const { email, word, definition } = req.body;

  // Validate the request body
  if (!email || !word || !definition) {
    return res.status(400).json({ error: 'Email, word, and definition are required.' });
  }

  try {
    const newEntry = new GlossaryEntry({ email, word, definition });
    await newEntry.save();
    res.status(200).json({ message: 'Glossary entry stored successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
