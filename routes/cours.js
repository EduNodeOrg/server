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


  // GET average rating for a specific course
router.get('/courses/:id/average-rating', async (req, res) => {
  try {
    const courseId = req.params.id;

    // Find the course by ID
    const course = await Cours.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Calculate the average rating
    const totalRatings = course.feedbacks.length;
    let sumRatings = 0;

    for (const feedback of course.feedbacks) {
      sumRatings += feedback.rate;
    }

    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update the course's average rating field
    course.feedbacksavg = averageRating;
    await course.save();

    res.json({ averageRating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;


module.exports = router;
