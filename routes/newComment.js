const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');

router.post("/", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    const { author, comment } = req.body;
    const newComment = new Comment({
        author,
        comment
      });
      newComment.save()
      res.json(
        req.body
      );
})

router.get("/", (req, res) => {
  Comment.find()
  .then(Comments => res.json(Comments))
  .catch(err => res.status(400).json("Error: " + err));
})

module.exports = router;