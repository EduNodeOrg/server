const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Cours = require("../models/Cours");
const User = require('../models/User');
// Create a new Cours
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email,privatee,questions,grade } = req.body;
      //const authorEmail= req.user.auth.email;
      const cours = new Cours({
        title,
        description,
        date,
        link,
        tags,
        email,
        privatee,
        questions,
        grade
        // assuming you have a middleware that sets req.user to the currently logged in user
      });
      
      await cours.save();
      res.status(201).json(cours);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  


  router.put('/increment-trophy', async (req, res) => {
    const { email } = req.body;
  
    try {
      // Find the user by their email
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Increment the trophy value by 1
      user.AddCoursesTrophy += 1;
  
      // Save the updated user to the database
      await user.save();
  
      return res.status(200).json({ message: 'Trophy incremented successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error' });
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
    const courseId = req.params.courseId;
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


router.get("/course/:id", async (req, res) => {
  try {
    const course = await Cours.findById(req.params.id).populate("author", "_id name email");
    if (!course) {
      return res.status(404).send({ error: "course not found" });
    }
    res.send(course);
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});

// Route for adding a comment
router.post('/comments/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  const newComment = {
    text: req.body.text,
    email: req.body.email,
  };

  try {
    const course = await Cours.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    course.comments.push(newComment);
    await course.save();
    res.json(course);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});




router.get('/comments/:courseId', async (req, res) => {
  const courseId = req.params.courseId;
  try {
    const course = await Cours.findById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    const comments = course.comments;
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/coursemail/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const courses = await Cours.find({ email: email });

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});


module.exports = router;


module.exports = router;
