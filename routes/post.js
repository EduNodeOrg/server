const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Post = require("../models/Post");

// Create a new post
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email } = req.body;
      //const authorEmail= req.user.auth.email;
      const post = new Post({
        title,
        description,
        date,
        link,
        tags,
        email,
        // assuming you have a middleware that sets req.user to the currently logged in user
      });
  
      await post.save();
      res.status(201).json(post);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// Get all posts
router.get("/post", async (req, res) => {
    try {
      const posts = await Post.find().populate("author", "_id name email");
      res.send(posts);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

module.exports = router;
