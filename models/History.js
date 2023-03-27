const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
  OperationId: {
    type: String,
    trim: true,
    required: true
  },
  senderAccount: {
    type: String,
    trim: true,
    required: true
  },
  receiverAccount: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  asetname: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('HistorySchema', HistorySchema);