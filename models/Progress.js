const mongoose = require("mongoose");

const ProgressSchema = new mongoose.Schema({
  progress: {
    type: String,
    trim: true,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ProgressSchema", ProgressSchema);
