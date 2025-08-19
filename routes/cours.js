const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth')
const Cours = require("../models/Cours");
const Notification = require("../models/Notification");
const User = require('../models/User');

// Middleware to validate ObjectId
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid course ID' });
  }
  next();
};

// Apply validation to all routes with :id parameter
router.param('id', validateObjectId);
router.param('courseId', validateObjectId);

// Create a new Cours
router.post("/", async (req, res) => {
  try {
    const { title, description, link, date, tags, email, privatee, questions, grade } = req.body;
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
  const newNotification = new Notification({
    message:
      "Congrats! You have a new Course Badge for adding a Course !",
    time: new Date(),
    email: req.body.email,
  });
  await newNotification.save();
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
  try {
    const cours = await Cours.findById(req.params.courseId);
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
  
  // Validate required fields
  if (!req.body.rating || !req.body.email) {
    return res.status(400).json({ 
      error: 'Rating and email are required',
      received: req.body 
    });
  }

  // Parse and validate rating
  const rating = parseFloat(req.body.rating);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ 
      error: 'Rating must be a number between 1 and 5',
      received: req.body.rating 
    });
  }

  // Create feedback object with validated data
  const newFeedback = {
    rating: rating,
    text: req.body.text || '',
    email: req.body.email.trim(),
    date: new Date() // Always use server time
  };

  try {
    // Find course with session for atomic update
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const course = await Cours.findById(courseId).session(session);
      if (!course) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Course not found' });
      }

      // Add new feedback
      course.feedbacks.push(newFeedback);
      
      // Calculate new average rating
      if (course.feedbacks && course.feedbacks.length > 0) {
        const sumRatings = course.feedbacks.reduce((sum, fb) => sum + (fb.rating || 0), 0);
        course.feedbacksavg = parseFloat((sumRatings / course.feedbacks.length).toFixed(1));
      } else {
        course.feedbacksavg = 0;
      }

      // Save the updated course
      await course.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Return the saved feedback without sensitive data
      const savedFeedback = course.feedbacks[course.feedbacks.length - 1];
      res.status(201).json({
        _id: savedFeedback._id,
        rating: savedFeedback.rating,
        text: savedFeedback.text,
        date: savedFeedback.date
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error; // Let the outer catch handle it
    }

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    // Initialize variables
    let averageRating = 0;
    
    // Only calculate if there are feedbacks
    if (course.feedbacks && course.feedbacks.length > 0) {
      const totalRatings = course.feedbacks.length;
      const sumRatings = course.feedbacks.reduce((sum, feedback) => {
        // Ensure feedback.rating is a valid number
        const rating = typeof feedback.rating === 'number' ? feedback.rating : 0;
        return sum + rating;
      }, 0);
      
      averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
      
      // Update the course's average rating field
      try {
        course.feedbacksavg = parseFloat(averageRating.toFixed(1)); // Store as a number with 1 decimal
        await course.save();
      } catch (saveError) {
        console.error('Error saving course with updated average:', saveError);
        // Continue with the response even if save fails
      }
    }

    res.json({ 
      averageRating: averageRating,
      totalRatings: course.feedbacks?.length || 0
    });
  } catch (error) {
    console.error('Error calculating average rating:', error);
    res.status(500).json({ 
      message: 'Server Error',
      error: error.message 
    });
  }
});

router.get("/course/:id", async (req, res) => {
  try {
    const course = await Cours.findById(req.params.id).populate("author", "_id name email");
    if (!course) {
      return res.status(404).send({ error: "Course not found" });
    }
    res.send(course);
  } catch (error) {
    console.error('Error in /course/:id:', error);
    res.status(500).send({ error: 'Server error' });
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
