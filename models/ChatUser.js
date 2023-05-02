const mongoose = require('mongoose');

const ChatUserSchema = new mongoose.Schema({

  input: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false
  },
  output: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  }
  
},

);

const ChatUser = mongoose.model('chatuser', ChatUserSchema);

module.exports = ChatUser;
