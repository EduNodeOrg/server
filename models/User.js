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
   role:{
    type: String,
    default:'Student',
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
  Points: {
    type: Number,
    default: 1000,
  },
  rating: {
    type: Number,
    default: 1000,
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
      },
      userInfo: {
        type: String,
        
      },
    }
  ],

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  emailPreferences: {
    marketing: {
      type: Boolean,
      default: true
    },
    notifications: {
      type: Boolean,
      default: true
    },
    newsletters: {
      type: Boolean,
      default: true
    },
    updates: {
      type: Boolean,
      default: true
    },
    courseRecommendations: {
      type: Boolean,
      default: true
    },
    achievementNotifications: {
      type: Boolean,
      default: true
    }
  },
  lastEmailSent: {
    type: Date,
    required: false
  },
  emailFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'never'],
    default: 'weekly'
  },
  stripeCustomerId: {
    type: String,
    required: false
  },
  subscriptionId: {
    type: String,
    required: false
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'none'],
    default: 'none'
  },
  subscriptionPlan: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free'
  },
  currentPeriodEnd: {
    type: Date,
    required: false
  }


},


);

const User = mongoose.model('User', UserSchema);


module.exports = User;
