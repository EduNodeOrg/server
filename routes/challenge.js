const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth')
const Challenge = require("../models/Challenge");
const User = require('../models/User');


router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags, email, privatee } = req.body;
      //const authorEmail= req.user.auth.email;
      const challenge = new Challenge({
        title,
        description,
        date,
        link,
        tags,
        email,
        privatee,
        // assuming you have a middleware that sets req.user to the currently logged in user
      });
  
      await challenge.save();
      res.status(201).json(challenge);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

  router.get("/challenges", async (req, res) => {
    try {
      const Challenges = await Challenge.find().populate("author", "_id name email");
      res.send(Challenges);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

  router.get("/challenges/:id", async (req, res) => {
    try {
      const challenge = await Challenge.findById(req.params.id).populate("author", "_id name email");
      if (!challenge) {
        return res.status(404).send({ error: "Post not found" });
      }
      res.send(challenge);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });


  router.post('/comments/:challengeId', async (req, res) => {
    const challengeId = req.params.challengeId;
    const newComment = {
      text: req.body.text,
      email: req.body.email,
    };
  
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Post not found' });
      }
      challenge.comments.push(newComment);
      await challenge.save();
      res.json(challenge);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
  
  
  router.get('/comments/:challengetId', async (req, res) => {
    const challengetId = req.params.challengetId;
    try {
      const challenge = await Challenge.findById(challengetId);
      if (!challenge) {
        return res.status(404).json({ error: 'Post not found' });
      }
      const comments = challenge.comments;
      res.json(comments);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  
  

module.exports = router;