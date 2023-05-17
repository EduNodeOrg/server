const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Post = require("../models/Post");

// Create a new post
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email,privatee } = req.body;
      //const authorEmail= req.user.auth.email;
      const post = new Post({
        title,
        description,
        date,
        link,
        tags,
        email,
        privatee,
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
  router.get("/posts/:id", async (req, res) => {
    try {
      const post = await Post.findById(req.params.id).populate("author", "_id name email");
      if (!post) {
        return res.status(404).send({ error: "Post not found" });
      }
      res.send(post);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


// Route for adding a comment
router.post('/comments/:postId', async (req, res) => {
  const postId = req.params.postId;
  const newComment = {
    text: req.body.text,
    email: req.body.email,
  };

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    post.comments.push(newComment);
    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});




router.get('/comments/:postId', async (req, res) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    const comments = post.comments;
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

  

module.exports = router;
