const mongoose = require('mongoose');

const universitySchema = new mongoose.Schema({
  AD: String,
  'World Universities': String,
  'http://www.uda.ad/': String
});

const University = mongoose.model('University', universitySchema);

module.exports = University;
