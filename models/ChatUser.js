const mongoose = require('mongoose');

const ChatUserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: false
  },
  input: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  output: {
    type: String,
    required: false
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  confirmationCode: {
    type: String,
    required: false
  },
  id: {
    type: String,
    required: false
  },
},

);

const ChatUser = mongoose.model('chatuser', ChatUserSchema);

module.exports = ChatUser;
