const express = require('express');
const router = express.Router();
const BlogDy = require('../models/BlogDyn'); // Assuming the path to the blog model file is correct

// Create a new blog post
router.post('/', (req, res) => {
  const { title, subtitles, subtitleTexts, subtitleTextItems, conclusion } = req.body;

  // Create a new blog entry using the Blog model
  const newBlog = new BlogDy({
    title,
    subtitles,
    subtitleTexts,
    subtitleTextItems,
    conclusion
  });

  // Save the blog entry to the database
  newBlog.save()
    .then((savedBlog) => {
      console.log("New blog entry saved successfully!");
      res.status(201).json(savedBlog);
    })
    .catch((error) => {
      console.error("Error saving the blog entry:", error);
      res.status(500).json({ error: "An error occurred while saving the blog entry." });
    });
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
