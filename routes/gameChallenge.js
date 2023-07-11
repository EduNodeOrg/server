const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth')
const GameChallenge = require("../models/GameChallenge");
const User = require('../models/User');
const Notification = require("../models/Notification");




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
                challengeStarted : false
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
        if (gameChallenge ) {
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

    try {
        let gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });

        if (gameChallenge) {
            gameChallenge.winner = localEmail;
            if (gameChallenge.user1email === localEmail) {
                gameChallenge.user1grade = grade;
            } else if (gameChallenge.user2email === localEmail) {
                gameChallenge.user2grade = grade;
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
                const newNotification = new Notification({
                    message:
                        `Congrats you have won a Challenge Game!`,
                    time: new Date(),
                    email: winner,
                });
                await newNotification.save();
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