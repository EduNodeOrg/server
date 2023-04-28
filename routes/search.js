const express = require('express');
const router = express.Router();
const Cours = require('../models/Cours');
const Post = require('../models/Post');

router.get('/', async (req, res) => {
  try {
    const searchQuery = req.query.searchQuery;
    console.log('search' ,searchQuery);
    const regex = new RegExp(searchQuery, "i");
    
    const courses = await Cours.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    });
    const posts = await Post.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    });
    
    res.json({ courses, posts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;