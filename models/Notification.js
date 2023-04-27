
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
 
    message: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
    required: false
  },


});

module.exports = notifications = mongoose.model("notifications", notificationSchema);
