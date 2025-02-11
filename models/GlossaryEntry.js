const mongoose = require('mongoose');

const glossaryEntrySchema = new mongoose.Schema({
  email: { type: String, required: true },
  word: { type: String, required: true },
  definition: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted','rejected'],
    default: 'pending'
  },
});

const GlossaryEntry = mongoose.model('GlossaryEntry', glossaryEntrySchema);

module.exports = GlossaryEntry;
