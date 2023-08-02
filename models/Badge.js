const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  email: { type: String, required: true },
  title: { type: String, required: true },
  tags: [{ type: String }],
  link: { type: String },
  description: { type: String, required: true },
  criteria: { type: String, required: true },
  expiration: { type: Date, required: true },
  privatee: { type: Boolean, default: false },
  image: { type: String },
}, { timestamps: true });

const Badge = mongoose.model('Badge', badgeSchema);

module.exports = Badge;
