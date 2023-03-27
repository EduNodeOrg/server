const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema({
  isFirstCourseActive: {
    type: Boolean,
    default: false,
  },
  isSecondCourseActive: {
    type: Boolean,
    default: false,
  },
  isThirdCourseActive: {
    type: Boolean,
    default: false,
  },
});

const Answer = mongoose.model("Answer", AnswerSchema);

module.exports = Answer;
