const express = require('express');
const router = express.Router();
const SearchData = require('../models/SearchData');

router.get('/search', (req, res) => {
  SearchData.find({}, (err, searchResults) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(searchResults);
    }
  });
});

module.exports = router;

