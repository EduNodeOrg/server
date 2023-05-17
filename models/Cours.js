const mongoose = require('mongoose');

const CoursSchema = new mongoose.Schema({
  
  
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
  
  
},

);

const Cours = mongoose.model("Cours", CoursSchema);


module.exports = Cours;
