const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const University = require('../models/University'); 
const fs = require('fs');
// API endpoint to import the JSON file into MongoDB and fetch university names
router.get('/', async (req, res) => {
  const jsonFilePath = './universities.json'; 
  const mongoURI = process.env.MONGO_URI; // Replace with your MongoDB connection URI
  const mongoImportCommand = `mongoimport --uri "mongodb+srv://EduNodeUser:EduNodeUser@db-kgoai.mongodb.net/db?retryWrites=true&w=majority" --collection universities --type json --file ./universities.json --jsonArray`;

  exec(mongoImportCommand, async (err, stdout, stderr) => {
    if (err) {
      console.error(`Error executing mongoimport: ${err}`);
      // Handle the error appropriately
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      console.log('JSON file imported successfully');

      try {
        const universities = await University.find({}, 'World Universities'); 

        const universityNames = universities.map(university => university['World Universities']);

        // Send the university names to the frontend
        // res.json(universityNames);
      } catch (fetchError) {
        console.error(`Error fetching university names: ${fetchError}`);
        // Handle the error appropriately
        res.status(500).json({ error: 'Internal Server Error' });
      }
    }
  });
});

router.get('/universities', async (req, res) => {
  try {
    const universities = await University.find({}, 'World Universities');
    const universityNames = universities.map(university => university['World Universities']);
    // res.json(universityNames);
  } catch (error) {
    console.error(`Error fetching university names: ${error}`);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});





router.get('/read-json', (req, res) => {
  fs.readFile('./universities.json', 'utf8', (err, jsonString) => {
    if (err) {
      console.log("File read failed:", err);
      return res.status(500).json({ error: 'Failed to read file' });
    }

    const data = JSON.parse(jsonString);

    exec('echo "File read successful"', (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return res.status(500).json({ error: 'Failed to execute command' });
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return res.status(500).json({ error: 'Command execution error' });
      }

      return res.status(200).json({ message: stdout, data: data});
    });
  });
});


module.exports = router;
