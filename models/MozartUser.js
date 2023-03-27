const mongoose = require('mongoose');

const MozartUserSchema = new mongoose.Schema({
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
    required: false,
 
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
  courseOneDone: {
    type: Boolean,
    default: false,
  },
  pkey: {
    type: String,
    required: false,
  },
});

const FreighterUser = mongoose.model('MozartUser', MozartUserSchema);

module.exports = FreighterUser;