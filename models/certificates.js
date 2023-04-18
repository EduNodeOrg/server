
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CertificateSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  cid: {
    type: String,
    required: false,
  },
  certificateNumber: {
    type: Number,
    required: true,
    unique: true
  }
});

module.exports = certificates = mongoose.model("certificates", CertificateSchema);
