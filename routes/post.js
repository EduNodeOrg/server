const express = require("express");
const router = express.Router();

const Post = require("../models/Post");

// Create a new post
router.post("/", async (req, res) => {
    try {
      const { title, description, link, email, tags } = req.body;
  
      const post = new Post({
        title,
        description,
        
        link,
        tags
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
router.get("/posts", async (req, res) => {
    try {
      const posts = await Post.find().populate("author", "_id name email");
      res.send(posts);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

module.exports = router;
