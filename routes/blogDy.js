const express = require('express');
const router = express.Router();
const BlogDy = require('../models/BlogDyn'); // Assuming the path to the blog model file is correct

// Create a new blog post
router.post("/", async (req, res) => {
    try {
      const {
        title,
        subtitles,
        subtitle1Text,
        subtitle2Text,
        subtitle3Text,
        subtitleTextItems,
        conclusion,
      } = req.body;
  
      // Create the blog post with the provided data
      const blog = new BlogDy({
        title,
        subtitles,
        subtitleTexts: [subtitle1Text, subtitle2Text, subtitle3Text],
        subtitleTextItems,
        conclusion,
      });
  
      // Save the blog post to the database
      const savedBlog = await blog.save();
  
      res.status(201).json(savedBlog);
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });


router.get('/:id', (req, res) => {
    const blogId = req.params.id;
  
    // Find the blog in the database by its ID
    BlogDy.findById(blogId)
      .then((blog) => {
        if (!blog) {
          return res.status(404).json({ error: 'Blog not found' });
        }
        res.status(200).json(blog);
      })
      .catch((error) => {
        console.error('Error fetching the blog:', error);
        res.status(500).json({ error: 'An error occurred while fetching the blog' });
      });
  });
module.exports = router;
