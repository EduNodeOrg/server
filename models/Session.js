const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false
  },
  pubkey: {
    type: String,
    required: false,
    unique: true
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Session = mongoose.model('sessions', SessionSchema);

module.exports = Session;
