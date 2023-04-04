
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CertificateSchema = new Schema({
  image: {
    type: String,
    required: true,
  },
});

module.exports = Certificates = mongoose.model("Certificates", CertificateSchema);
