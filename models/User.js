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
  university: {
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
  },
  images: {
    type: [String], 
    required: false
  },
  CoursesTrophy: {
    type: Number,
    default: 0,
  },
  PostsTrophy: {
    type: Number,
    default: 0,
  },
  AddCoursesTrophy: {
    type: Number,
    default: 0,
  },
  ChallengesTrophy: {
    type: Number,
    default: 0,
  },
  resetToken: {
    type: String
  },
  resetTokenExpiration: {
    type: Date,
    
  },
  friendRequests: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'accepted'],
        default: 'pending'
      }
    }
  ],

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ]


},


);

const User = mongoose.model('user', UserSchema);

module.exports = User;
