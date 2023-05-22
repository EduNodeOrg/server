const express = require('express');
const router = express.Router();
const Cours = require('../models/Cours');
const Post = require('../models/Post');
const Blog = require('../models/Blog');
const User = require('../models/User');
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
    const blogs = await Blog.find({
      $or: [
        { title: { $regex: regex } },
        { description: { $regex: regex } },
        { tags: { $regex: regex } }
      ]
    });
    
    res.json({ courses, posts,blogs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Find the user by email to get their preferences and skills
    const user = await User.findOne({ email });

    // Extract preferences and skills from the user object
    const { preferences, skills } = user;

    // Build the search query for finding matching posts, blogs, and courses
    const searchQuery = {
      $or: [
        { title: { $in: preferences.concat(skills) } },
        { description: { $in: preferences.concat(skills) } },
        { tags: { $in: preferences.concat(skills) } }
      ]
    };

    // Find posts, blogs, and courses based on the search query
    const posts = await Post.find(searchQuery);
    const blogs = await Blog.find(searchQuery);
    const courses = await Cours.find(searchQuery);

    // Return the found posts, blogs, and courses
    res.json({ posts, blogs, courses });
  } catch (err) {
    // Handle any errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;