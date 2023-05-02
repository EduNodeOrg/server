const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Blog = require("../models/Blog");

// Create a new Blog
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email } = req.body;
      //const authorEmail= req.user.auth.email;
      const blogs = new Blog({
        title,
        description,
        date,
        link,
        tags,
        email,
        // assuming you have a middleware that sets req.user to the currently logged in user
      });
      
      await blogs.save();
      res.status(201).json(blogs);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// Get all Courss
router.get("/blog", async (req, res) => {
    try {
      const blogs = await Blog.find().populate("author", "_id name email");
      res.send(blogs);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

module.exports = router;
