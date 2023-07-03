const express = require("express");
const router = express.Router();
const auth = require('../middleware/auth')
const GameChallenge = require("../models/GameChallenge");
const User = require('../models/User');



let challengeReadyCount = 0;
let challengeStarted = false;


router.post('/ready', async (req, res) => {
    const { gameNumber, localEmail } = req.body;
    // Store the user's readiness status
    challengeReadyCount++;
    console.log('a user is ready')
    if (challengeReadyCount === 2) {
        // Two users are ready, mark the challenge as started
        challengeStarted = true;
    }
    try {
        let gameChallenge = await GameChallenge.findOne({ gameNumber: gameNumber });

        if (gameChallenge) {
            // Update the existing game challenge
            if (gameChallenge.user1email === '') {
                gameChallenge.user1email = localEmail;
            } else if (gameChallenge.user2email === '') {
                gameChallenge.user2email = localEmail;
            }
        } else {
            // Create a new game challenge
            gameChallenge = new GameChallenge({
                gameNumber: gameNumber,
                user1email: localEmail,
                user2email: '',
                date: new Date(),
                user1grade: null,
                user2grade: null,
                winner: ''
            });
        }

        await gameChallenge.save();

        // Notify both users that the challenge has started
        res.send(challengeStarted);
    } catch (error) {
        console.error('Error:', error);
        res.sendStatus(500);
    }

});

router.get('/start', (req, res) => {
    if (challengeStarted) {
        res.send(challengeStarted);
    } else {
        res.sendStatus(404);
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






module.exports = router;