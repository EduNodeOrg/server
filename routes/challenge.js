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
      await post.save();
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

  let challengeReadyCount = 0;
  let challengeStarted = false;
  let challengeFinished = false;
  let winnerEmail = '';
  
  router.post('/ready', (req, res) => {
    // Store the user's readiness status
    challengeReadyCount++;
     console.log('a user is ready')
    if (challengeReadyCount === 2) {
      // Two users are ready, mark the challenge as started
      challengeStarted = true;
      res.send(challengeStarted);
      // Notify both users that the challenge has started
      
    }
    res.send(challengeStarted);
  });
  
  router.post('/submit', (req, res) => {
    // Evaluate the challenge submission and calculate the grade
    // Store the grade and other relevant information on the backend
  
    if (gradeCondition) {
      // The user meets the grade condition, set them as the winner
      winnerEmail = 'example@example.com'; 
      challengeFinished = true;
  
      // Notify both users about the winner
    }
  
    res.sendStatus(200);
  });
  
  

module.exports = router;