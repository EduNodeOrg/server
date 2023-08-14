const mongoose = require('mongoose');

const AddedCoursSchema = new mongoose.Schema({
  
  
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
  status: {
    type: String,
    enum: ['pending', 'accepted','rejected'],
    default: 'pending'
  },
  
},

);

const AddedCours = mongoose.model("AddedCourses", AddedCoursSchema);


module.exports = AddedCours;
