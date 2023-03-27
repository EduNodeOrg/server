const mongoose = require('mongoose');

const WebThreeAuthUserSchema = new mongoose.Schema({
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
  id: {
    type: String,
    required: false,
    // index: true
  },
  className: {
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

const WebThreeAuthUser = mongoose.model('WebThreeAuthUser', WebThreeAuthUserSchema);

module.exports = WebThreeAuthUser;