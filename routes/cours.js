const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Cours = require("../models/Cours");

// Create a new Cours
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email,privatee } = req.body;
      //const authorEmail= req.user.auth.email;
      const cours = new Cours({
        title,
        description,
        date,
        link,
        tags,
        email,
        privatee
        // assuming you have a middleware that sets req.user to the currently logged in user
      });
      
      await cours.save();
      res.status(201).json(cours);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// Get all Courss
router.get("/cours", async (req, res) => {
    try {
      const Courses = await Cours.find().populate("author", "_id name email");
      res.send(Courses);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  
  router.get('/cours/:courseId', async (req, res) => {
    const courseId = req.params.postId;
    try {
      const cours = await Cours.findById(courseId);
      if (!cours) {
        return res.status(404).json({ error: 'course not found' });
      }
      const feedbacks = cours.feedbacks;
      res.json(feedbacks);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/cours/:courseId', async (req, res) => {
    const courseId = req.params.courseId;
    const newFeedback = {
      rate:req.body.rate,
      text: req.body.text,
      email: req.body.email,
    };
  
    try {
      const cours = await Cours.findById(courseId);
      if (!cours) {
        return res.status(404).json({ error: 'course not found' });
      }
      cours.feedbacks.push(newFeedback);
      await cours.save();
      res.json(cours);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });


module.exports = router;
