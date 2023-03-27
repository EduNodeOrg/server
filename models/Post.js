const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  
  
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
    required: true,
  },
  
},

);

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
