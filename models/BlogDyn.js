const mongoose = require('mongoose');

const subtitleTextItemSchema = new mongoose.Schema({
    text: {
      type: String,
      required: true
    }
  });
  
  const blogSchema = new mongoose.Schema({
    title: {
      type: String,
      required: true
    },
    subtitles: [{
      type: String,
      required: true
    }],
    subtitleTexts: [{
      type: String,
      required: true
    }],
    subtitleTextItems: [subtitleTextItemSchema], 
    
    conclusion: {
      type: String,
      required: false
    }
  });
  

const BlogDy = mongoose.model('BlogDy', blogSchema);

module.exports = BlogDy;
