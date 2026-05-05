const mongoose = require('mongoose');

const CampaignAnalyticsSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    unique: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  dailyStats: [{
    date: {
      type: Date,
      required: true
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
    }
  }],
  segmentPerformance: [{
    segmentType: {
      type: String,
      required: true
    },
    segmentValue: {
      type: String,
      required: true
    },
    totalRecipients: {
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
    openRate: {
      type: Number,
      default: 0
    },
    clickRate: {
      type: Number,
      default: 0
    }
  }],
  linkTracking: [{
    url: {
      type: String,
      required: true
    },
    clicks: {
      type: Number,
      default: 0
    },
    uniqueClicks: {
      type: Number,
      default: 0
    }
  }],
  geographicData: [{
    country: {
      type: String,
      required: true
    },
    opens: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  }],
  deviceData: [{
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      required: true
    },
    opens: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  }],
  timeData: [{
    hour: {
      type: Number,
      min: 0,
      max: 23,
      required: true
    },
    opens: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    }
  }]
}, {
  timestamps: true
});

CampaignAnalyticsSchema.index({ campaignId: 1 });
CampaignAnalyticsSchema.index({ date: -1 });

module.exports = mongoose.model('CampaignAnalytics', CampaignAnalyticsSchema);
