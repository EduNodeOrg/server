const express = require('express');
const dotenv = require('dotenv');
dotenv.config({ path: './config/config.env' });
const router = express.Router();
const ChatUser = require('../models/ChatUser');
const { Configuration, OpenAIApi } = require("openai");
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');


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
    const codePlaceholder = '';
    async function generateText() {
      const response = await openai.createCompletion({
        model: "gpt-3.5-turbo-0125",
        prompt: `${input}, if the response contains any codes or commands, only the code and command returned should always start and end with 3 quotes '''${codePlaceholder}''' 
        so I can know where are the codes and commands.`,
        temperature: 0,
        max_tokens: 500,
      }) 
      const code = 'your code goes here';
      const output = response.data.choices[0].text.trim().replace(codePlaceholder, `'''${code}'''`);
      console.log(output);
      
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

router.post('/openai/plugin', async (req, res) => {
  const { message } = req.body; // Assuming the user's message is sent in the request body
  
  // Send the user's message to the ChatGPT API
  const response = await axios.post('https://api.openai.com/v1/completions', {
    prompt: message,
    max_tokens: 50, // Adjust as needed
    temperature: 0.7, // Adjust as needed
    model: "text-davinci-003",
  }, {
    headers: {
      'Authorization': 'Bearer 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',
      'Content-Type': 'application/json',
    },
  });
  
  // Extract the generated response from the API and send it back to the user
  const generatedText = response.data.choices[0].text.trim();
  res.send({ reply: generatedText });
});

// Define a route for handling POST requests to the Google GenAI API
router.post('/genai', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    res.status(200).json({ text: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong with Google GenAI' });
  }
});


module.exports = router;