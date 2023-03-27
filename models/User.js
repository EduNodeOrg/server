const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: false
  },
  name: {
    type: String,
    required: false
  },
  pkey: {
    type: String,
    required: false
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  courses: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  confirmationCode: {
    type: String,
    required: false
  },
  id: {
    type: String,
    required: false
  },
  profilePic: {
    type: String
  },
  courseOneDone: {
    type: Boolean,
    default: false
  }
},

);

const User = mongoose.model('user', UserSchema);

module.exports = User;
