
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const messageNotificationSchema = new Schema({
 
    message: {
    type: String,
    required: false,
  },
  receiver: {
    type: String,
    required: false,
  },
  date: {
    type: Date,
    default: Date.now,
    required: false
  },
  sender: {
    type: String,
    required: false,
  },


});

module.exports = messageNotifications = mongoose.model("messageNotifications", messageNotificationSchema);
