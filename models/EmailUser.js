const mongoose = require('mongoose');

const EmailUserSchema = new mongoose.Schema({
  email: { 
      type: String,
    // unique: true,
    required: false,

  },
  password: {
    type: String,
    required: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now,
    required: false
  },
  confirmationCode: {
    type: String,
    required: false
  },
  id: {
    type: mongoose.SchemaTypes.ObjectId,
    required: false, 
    index: true
  }
},

// { typeKey: '$type' }
);

const EmailUser = mongoose.model('emailuser', EmailUserSchema);

module.exports = EmailUser;
