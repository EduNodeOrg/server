const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  tags: {
    type: [String],
    required: true,
  },
  
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    
  },
  email: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
    required: false
  },
  privatee: {
    type: Boolean,
    required: false
  },
  feedbacks: [
    {

      rate: {
        type: Number,
        required: true,
      },
      text: {
        type: String,
        required: false,
      },
      email: {
        type: String,
        required: true,
      },
    },
  ],
  feedbacksavg:{
    type: Number,
    required: false,
  },
  comments: [
    {
      text: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
  ],
  
  
},

);

const Challenge = mongoose.model("Challenge", ChallengeSchema);


module.exports = Cours;