const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });
const router = express.Router();
const ChatUser = require('../models/ChatUser');
const { Configuration, OpenAIApi } = require("openai");





// Define a route for handling POST requests to the OpenAI API
router.post('/openai', async (req, res) => {
  // Extract the prompt text from the request body
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { input, email } = req.body;
  console.log("log", email)
  console.log(input)
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const input1= input
  
    async function generateText() {
      const response = await openai.createCompletion({
        model: "code-davinci-002",
        prompt: input1,
        temperature: 0,
        max_tokens: 500,
      }) 
      console.log(response.data.choices[0].text.trim());
      
      // Save data to the database
      const chatUser = new ChatUser({
        input,
        email,
        output: response.data.choices[0].text.trim(),
      });
      await chatUser.save();

      // Return response to the client
      res.status(201).json({msg: response.data.choices[0].text.trim()});
    }
    await generateText();
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});


router.get('/openai/:email', async (req, res) => {
  const { email } = req.params;
  try {
    const chatUsers = await ChatUser.find({ email });
    res.status(200).json(chatUsers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});



module.exports = router;