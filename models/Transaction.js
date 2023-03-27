const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  senderId: {
    type: String,
    trim: true
  },
  receiverId: {
    type: String,
    trim: true,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  assetName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);