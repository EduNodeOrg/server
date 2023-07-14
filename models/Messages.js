const mongoose = require('mongoose');


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
      type: String,
      default: () => moment().fromNow(),
    },
  });
  
  const Message = mongoose.model('Message', messageSchema);
  module.exports = Message;