const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  
  
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
  image: {
    type:String,
    required: false
  }
  
},

);

const Project = mongoose.model("Project", ProjectSchema);


module.exports = Project;
