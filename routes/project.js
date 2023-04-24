const express = require("express");
const router = express.Router();
const auth =require('../middleware/auth')
const Post = require("../models/Project");
const Project = require("../models/Project");

// Create a new project
router.post("/", async (req, res) => {
    try {
      const { title, description, link, image, email } = req.body;
      //const authorEmail= req.user.auth.email;
      const project = new Project({
        title,
        description,
        link,
        image,
        email,
      });
  
      await project.save();
      res.status(201).json(project);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
// Get all projects
router.get("/projects", async (req, res) => {
    try {
      const projects = await Project.find().populate("author", "_id email");
      res.send(projects);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });
  

module.exports = router;
