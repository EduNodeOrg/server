const mongoose = require('mongoose');

const EmailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  subject: {
    type: String,
    required: true
  },
  htmlContent: {
    type: String,
    required: true
  },
  textContent: {
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['welcome', 'newsletter', 'promotion', 'notification', 're-engagement', 'course', 'achievement', 'custom'],
    default: 'custom'
  },
  variables: [{
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'array', 'object'],
      default: 'string'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  previewText: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

EmailTemplateSchema.index({ category: 1, isActive: 1 });
EmailTemplateSchema.index({ createdBy: 1 });
EmailTemplateSchema.index({ name: 1 });

module.exports = mongoose.model('EmailTemplate', EmailTemplateSchema);
