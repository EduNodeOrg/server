
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ValidCertificateSchema = new Schema({
  image: {
    type: String,
    required: false,
  },
  name: {
    type: String,
    required: false,
  },
  university: {
    type: String,
    required: false,
  },
  url: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
});
module.exports = validCertificates = mongoose.model("validCertificates", ValidCertificateSchema);
