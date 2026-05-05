const mongoose = require('mongoose');

const UnsubscribeSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: false
  },
  reason: {
    type: String,
    enum: ['no_longer_interested', 'too_many_emails', 'irrelevant_content', 'never_subscribed', 'accidental', 'other'],
    required: false
  },
  customReason: {
    type: String,
    required: false
  },
  preferences: {
    marketing: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: false
    },
    newsletters: {
      type: Boolean,
      default: false
    },
    updates: {
      type: Boolean,
      default: false
    }
  },
  unsubscribedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: {
    type: String,
    required: false
  },
  userAgent: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

UnsubscribeSchema.index({ email: 1 }, { unique: true });
UnsubscribeSchema.index({ userId: 1 });
UnsubscribeSchema.index({ campaignId: 1 });
UnsubscribeSchema.index({ unsubscribedAt: -1 });

module.exports = mongoose.model('Unsubscribe', UnsubscribeSchema);
