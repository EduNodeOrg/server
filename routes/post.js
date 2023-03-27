const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Post = require("../models/post");

// Create a new post
router.post("/", auth, async (req, res) => {
    try {
        const { title, description, link, tags } = req.body;
        const author = req.user.id;
    

        const post = new Post({ title, description, link, tags, author });

  
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
      const posts = await Post.find().populate("author");
      res.send(posts);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

module.exports = router;
