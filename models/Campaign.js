const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate',
    required: true
  },
  customTemplateContent: {
    type: String,
    required: false,
    description: 'Custom HTML content that overrides the base template'
  },
  segments: [{
    type: {
      type: String,
      enum: ['role', 'activity', 'skills', 'preferences', 'courses', 'location', 'custom'],
      required: true
    },
    criteria: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date,
    required: false
  },
  sentAt: {
    type: Date,
    required: false
  },
  completedAt: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  analytics: {
    totalRecipients: {
      type: Number,
      default: 0
    },
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
    default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    },
    complaints: {
      type: Number,
      default: 0
    }
  },
  settings: {
    trackOpens: {
      type: Boolean,
      default: true
    },
    trackClicks: {
      type: Boolean,
      default: true
    },
    unsubscribeLink: {
      type: Boolean,
      default: true
    },
    batchSize: {
      type: Number,
      default: 100
    },
    delayBetweenBatches: {
      type: Number,
      default: 1000
    }
  }
}, {
  timestamps: true
});

CampaignSchema.index({ status: 1, scheduledAt: 1 });
CampaignSchema.index({ createdBy: 1 });
CampaignSchema.index({ 'analytics.sent': -1 });

module.exports = mongoose.model('Campaign', CampaignSchema);
