const express = require('express');
const dotenv = require('dotenv'); 
dotenv.config({ path: './config/config.env' });
const router = express.Router();
const ChatUser = require('../models/ChatUser');
const { Configuration, OpenAIApi } = require("openai");

router.get("/", (req, res) => {
  res.json("welcome to our /openai route, refer to our docs for more info")
})
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
    const openai = new ChatUser(configuration);
    
    async function generateText() {
      const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: input,
          temperature: 0,
          max_tokens: 50,
        })
        .then(response => {
          console.log(response.data);
          console.log(response.data.choices[0].text);
          
          // response.json({msg: response.data.choices[0].text})
        })
        .catch(error => {
          console.log(error);
        });

      }
      generateText()
    // console.log(completion.data.choices[0].text);
    // console.log(res.data.choices[0].text)
     
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;