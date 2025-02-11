const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  
  
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
  
  
},

);

const Blog = mongoose.model("Blog", BlogSchema);


module.exports = Blog;
