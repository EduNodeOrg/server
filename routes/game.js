const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth')
const Game = require("../models/AddGame");
const User = require('../models/User');
// Create a new Cours
router.post("/", async (req, res) => {
  try {
    const { title, description, image, date, tags, email, privatee, questions, duration } = req.body;
    //const authorEmail= req.user.auth.email;
    const game = new Game({
      title,
      description,
      date,
      image,
      tags,
      email,
      privatee,
      questions,
      duration
     
    });

    await game.save();
    res.status(201).json(game);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;