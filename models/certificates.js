
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
    required: true,
    unique: true
  }
});
{/*CertificateSchema.pre('save', function (next) {
  const certificate = this;
  if (!certificate.certificateNumber) {
    certificate.certificateNumber = Math.floor(Math.random() * 1000000);
  }
  next();
});*/}
module.exports = certificates = mongoose.model("certificates", CertificateSchema);
