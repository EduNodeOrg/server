const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: false,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  messageId: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained', 'failed'],
    default: 'queued'
  },
  events: [{
    eventType: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'complained', 'failed'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: false
    }
  }],
  sentAt: {
    type: Date,
    required: false
  },
  deliveredAt: {
    type: Date,
    required: false
  },
  openedAt: {
    type: Date,
    required: false
  },
  clickedAt: {
    type: Date,
    required: false
  },
  bouncedAt: {
    type: Date,
    required: false
  },
  bounceReason: {
    type: String,
    required: false
  },
  unsubscribedAt: {
    type: Date,
    required: false
  },
  complaintReason: {
    type: String,
    required: false
  },
  templateData: {
    type: mongoose.Schema.Types.Mixed,
    required: false
  }
}, {
  timestamps: true
});

EmailLogSchema.index({ campaignId: 1, status: 1 });
EmailLogSchema.index({ userId: 1, status: 1 });
EmailLogSchema.index({ email: 1 });
EmailLogSchema.index({ 'events.timestamp': -1 });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
