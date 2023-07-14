const mongoose = require('mongoose');
const moment = require('moment');

const messageSchema = new mongoose.Schema({
    senderEmail: {
      type: String,
      required: true,
    },
    receiverEmail: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  });


  messageSchema.methods.getRelativeTime = function () {
    const threshold = 1 * 60 * 1000; // 1 minutes in milliseconds
    const diff = Date.now() - this.timestamp;
  
    if (diff < threshold) {
      return moment(this.timestamp).fromNow();
    } else {
      return moment(this.timestamp).format('YYYY-MM-DD HH:mm:ss');
    }
  };



  
  const Message = mongoose.model('Message', messageSchema);
  module.exports = Message;