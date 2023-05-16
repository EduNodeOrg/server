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
    required: false,
  },
  courses: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    required: false
  },
  age: {
    type: Number,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    required: false
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
  },
  preferences:{
    type: [String],
    required: false,
  },
  skills:{
    type: [String],
    required: false,
    default:[]
  }
},

);

const User = mongoose.model('user', UserSchema);

module.exports = User;
