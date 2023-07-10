const mongoose = require('mongoose');

const GameChallengeSchema = new mongoose.Schema({
  gameNumber: {
    type: String,
    required: true
  },
  challengeReadyCount: {
    type: Number,
    required: false,
    default:0,
  },
  user1email: {
    type: String,
    required: false
  },
  user2email: {
    type: String,
    required: false
  },

  date: {
    type: Date,
    default: Date.now,
    required: false
  },
  user1grade: {
    type: Number,
    required: false
  },
  user2grade: {
    type: Number,
    required: false
  },
  winner: {
    type: String,
    required: false
  },
  challengeFinished: {
    type: Boolean,
    required: false
  },
  challengeStarted: {
    type: Boolean,
    required: false,
    default:false
  },
  
},

);

const GameChallenge = mongoose.model("GameChallenge", GameChallengeSchema);


module.exports = GameChallenge;