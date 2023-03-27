const mongoose = require('mongoose');

const TwitterUserSchema = new mongoose.Schema({
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
  twitterId: {
    type: String,
    required: true,
    unique: true,
  },
  twitterProfilePic: {
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

const TwitterUser = mongoose.model('TwitterUser', TwitterUserSchema);

module.exports = TwitterUser;
