const express = require('express');
const router = express.Router();
const Cours = require('../models/Cours');
const Post = require('../models/Post');
const Blog = require('../models/Blog');
const User = require('../models/User');
const axios = require('axios');

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

router.get('/youtube/:email', async (req, res) => {
  try {
    const { email } = req.params;

    // Find the user by email to get their preferences and skills
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract preferences and skills from the user object with defaults
    const preferences = user.preferences || [];
    const skills = user.skills || [];

    // Combine preferences and skills into a single array for the YouTube API query
    const allSearchTerms = [...new Set([...preferences, ...skills])]; // Remove duplicates

    // If no search terms are available, return an empty array
    if (allSearchTerms.length === 0) {
      return res.json({ videos: [] });
    }

    // Array to hold the results
    let allVideos = [];

    // Build the YouTube API search URL and make requests for each preference/skill
    for (const term of allSearchTerms) {
      try {
        const youtubeApiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&key=AIzaSyBIBbtXwgfnZhq3OXCA8uewavg1lFZb-gY&type=video&maxResults=5&q=${encodeURIComponent(term)}`;
        const response = await axios.get(youtubeApiUrl);
        if (response.status === 200) {
          const videos = response.data.items;
          allVideos = allVideos.concat(videos.slice(0, 5));
        } else {
          console.error(`YouTube API request failed with status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error making YouTube API request:', error);
      }
    }

    // Return the found videos
    res.json({ videos: allVideos });
  } catch (err) {
    // Handle any errors
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/wiki/:searchQuery', async (req, res) => {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json');
  res.header('Content-Type', 'application/json');

  try {
    const { searchQuery } = req.params;

    const response = await axios.get(`https://en.wikipedia.org/w/api.php?action=opensearch&format=json&search=${searchQuery}`);

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching wiki data:', error.message);
    res.status(500).json({ error: 'Error fetching wiki data' });
  }
});

module.exports = router;