
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CertificateSchema = new Schema({
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
  cid: {
    type: String,
    required: false,
  },
  pkey: {
    type: String,
    required: false,
  },
  certificateNumber: {
    type: Number,
    required: false,
    unique: true
  },
  issuerPublicKey: {
    type: String,
    required: false,
  },
  issuerSecretKey: {
    type: String,
    required: false,
  },
  distributorSecretKey: {
    type: String,
    required: false
  },
  distributorPublicKey: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now
  },
  
});
module.exports = certificates = mongoose.model("certificates", CertificateSchema);
