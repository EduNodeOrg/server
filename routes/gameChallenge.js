const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth')
const GameChallenge = require("../models/GameChallenge");
const User = require('../models/User');
const Notification = require("../models/Notification");
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });





router.post('/ready', async (req, res) => {
  const { gameNumber, localEmail } = req.body;
  try {
    let gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });

    if (gameChallenge) {
      // Update the existing game challenge
      if (gameChallenge.user1email === '') {
        gameChallenge.user1email = localEmail;
      } else if (gameChallenge.user2email === '') {
        gameChallenge.user2email = localEmail;
        gameChallenge.challengeStarted = true;
        gameChallenge.challengeReadyCount = 2;
      }
    } else {
      // Create a new game challenge
      gameChallenge = new GameChallenge({
        challengeReadyCount: 1,
        gameNumber: gameNumber,
        user1email: localEmail,
        user2email: '',
        date: new Date(),
        user1grade: null,
        user2grade: null,
        winner: '',
        challengeStarted: false
      });
    }

    await gameChallenge.save();

    // Notify both users that the challenge has started
    res.send(gameChallenge.challengeStarted);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }

});

router.get('/start/:gameNumber', async (req, res) => {
  try {
    const { gameNumber } = req.params;
    const gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });
    if (gameChallenge) {
      res.send(gameChallenge.challengeStarted);
    } else {
      res.sendStatus(404);
    }
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

router.post('/submit', async (req, res) => {
  const { localEmail, challengeFinished, grade, gameNumber } = req.body;
  const kFactor = 32;
  try {
    let gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });

    if (gameChallenge) {
      gameChallenge.winner = localEmail;
      const newNotification = new Notification({
        message:
          `Congrats! You have won a Challenge Game!`,
        time: new Date(),
        email: gameChallenge.winner,
      });
      await newNotification.save();

      if (gameChallenge.user1email === localEmail) {
        gameChallenge.user1grade = grade;
        gameChallenge.user2grade = 0;
        const user2 = await User.findOne({ email: gameChallenge.user2email });
        const user1 = await User.findOne({ email: gameChallenge.localEmail });
        if (user2) {
          if (user2.Points < 100) {
            user2.Points = 0;
          } else {
            user2.Points -= 100;
          }

          await user2.save();



          const expectedScore = 1 / (1 + Math.pow(10, (user1.rating - user2.rating) / 400));
          const rate = user2.rating + kFactor * (gameChallenge.user2grade - expectedScore);
          user2.rating = rate;
          await user2.save();

          const expectedScore2 = 1 / (1 + Math.pow(10, (user2.rating - user1.rating) / 400));
          const rate2 = user1.rating + kFactor * (gameChallenge.user1grade - expectedScore2);
          user1.rating = rate2;
          await user1.save();

          const data = {
            from: 'hi@edunode.org',
            to: localEmail,
            subject: 'Challenge Outcome! ',
            text: `Congrats for winning the Edunode Challenge! You have won the challenge with ${grade} questions right and won 100 Edunode points !
            Your rating is ${rate}`
          };


          mg.messages.create(domain, data, function (error, body) {
            if (error) {
              console.log('Error sending email:', error);
              res.status(500).json({ error: 'Error sending email' });
            } else {
              console.log('Email sent successfully:', body);
              res.json({ msg: 'Email sent' });
            }
          });

          await user2.save();
        }
      } else if (gameChallenge.user2email === localEmail) {
        gameChallenge.user2grade = grade;
        gameChallenge.user1grade = 0;
        const user1 = await User.findOne({ email: gameChallenge.user1email });
        const user2 = await User.findOne({ email: gameChallenge.user2email });

        if (user1) {
          if (user1.Points < 100) {
            user1.Points = 0;
          } else {
            user1.Points -= 100;
          }

          await user1.save();

          const expectedScore = 1 / (1 + Math.pow(10, (user2.rating - user1.rating) / 400));
          const rate = user1.rating + kFactor * (gameChallenge.user1grade - expectedScore);
          user1.rating = rate;


          await user1.save();

          const expectedScore2 = 1 / (1 + Math.pow(10, (user1.rating - user2.rating) / 400));
          const rate2 = user2.rating + kFactor * (gameChallenge.user2grade - expectedScore2);
          user2.rating = rate2;
          await user2.save();


          const data = {
            from: 'hi@edunode.org',
            to: localEmail,
            subject: 'Challenge Outcome! ',
            text: `Congrats for winning the Edunode Challenge! You have won the challenge with ${grade} questions right and won 100 Edunode points !
            Your rating is ${rate2}`
          };


          mg.messages.create(domain, data, function (error, body) {
            if (error) {
              console.log('Error sending email:', error);
              res.status(500).json({ error: 'Error sending email' });
            } else {
              console.log('Email sent successfully:', body);
              res.json({ msg: 'Email sent' });
            }
          });

        }

        
      }

      gameChallenge.challengeFinished = challengeFinished;
      await gameChallenge.save();
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});



router.get('/finish/:gameNumber', async (req, res) => {
  const { gameNumber } = req.params;

  try {
    const gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });

    if (gameChallenge) {
      const { challengeFinished, winner } = gameChallenge;

      if (challengeFinished && winner) {

        res.json({ challengeFinished, winner });
      } else {
        res.json({ challengeFinished });
      }
    } else {
      res.status(404).json({ message: 'Game challenge not found' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.sendStatus(500);
  }
});

router.get("/winners", async (req, res) => {
  try {
    const challenges = await GameChallenge.find({ winner: { $exists: true, $ne: "" } });
    const winnersEmails = challenges.map((challenge) => {
      return {
        winnerEmail: challenge.winner,
      };
    });

    res.json(winnersEmails);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to retrieve winners' emails" });
  }
});






module.exports = router;