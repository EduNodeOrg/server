const mongoose = require('mongoose');

const tutorSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  university: String,
  teachingsProof: String,
  url: String,
  status: {
    type: String,
    enum: ['pending', 'accepted','rejected'],
    default: 'pending'
  },
});

const Tutor = mongoose.model('Tutor', tutorSchema);

module.exports = Tutor;
