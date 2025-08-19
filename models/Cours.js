const mongoose = require('mongoose');

const CoursSchema = new mongoose.Schema({
  
  
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: false
  },
  description: {
    type: String,
    required: true
  },
  mit: {
    type: String,
    required: false
  },
  questions: {
    type: String,
    required: false
  },
  grade: {
    type: Number,
    required: false
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
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      text: {
        type: String,
        default: ""
      },
      email: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  feedbacksavg: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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
  status: {
    type: String,
    enum: ['pending', 'accepted','rejected'],
    default: 'pending'
  },
  
},

);

const Cours = mongoose.model("Cours", CoursSchema);


module.exports = Cours;
