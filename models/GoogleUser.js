const mongoose = require('mongoose');

const GoogleUserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: false,
  },
  lastName: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  confirmationCode: {
    type: String,
    required: false,
  },
  googleId: {
    type: String,
    required: true,
    unique: true,
  },
  googleProfilePic: {
    type: String,
  },
  courseOneDone: {
    type: Boolean,
    default: false,
  },
  pkey: {
    type: String,
    required: false,
  },
});

const GoogleUser = mongoose.model('GoogleUser', GoogleUserSchema);

module.exports = GoogleUser;
