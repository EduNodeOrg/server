const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Cours = require("../models/Cours");

// Create a new Cours
router.post("/", async (req, res) => {
    try {
      const { title, description, link, date, tags,email } = req.body;
      //const authorEmail= req.user.auth.email;
      const cours = new Cours({
        title,
        description,
        date,
        link,
        tags,
        email,
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
  

module.exports = router;
