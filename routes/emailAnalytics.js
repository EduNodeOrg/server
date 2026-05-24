const express = require("express");
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const Campaign = require('../models/Campaign');
const CampaignAnalytics = require('../models/CampaignAnalytics');
const EmailLog = require('../models/EmailLog');
const auth = require('../middleware/auth');

// Get campaign analytics
router.get('/campaign/:id', async (req, res) => {
  try {
    const analytics = await analyticsService.getCampaignPerformance(req.params.id);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching campaign analytics:', error);
    res.status(500).json({ error: 'Failed to fetch campaign analytics' });
  }
});

// Get overall analytics
router.get('/overview', async (req, res) => {
  try {
    const overallStats = await analyticsService.getOverallAnalytics();
    res.json(overallStats);
  } catch (error) {
    console.error('Error fetching overall analytics:', error);
    res.status(500).json({ error: 'Failed to fetch overall analytics' });
  }
});

// Get user engagement stats
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const stats = await analyticsService.getUserEngagementStats(req.params.userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user engagement stats:', error);
    res.status(500).json({ error: 'Failed to fetch user engagement stats' });
  }
});

// Update campaign analytics (manual trigger)
router.post('/campaign/:id/update', auth, async (req, res) => {
  try {
    const analytics = await analyticsService.updateCampaignAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Error updating campaign analytics:', error);
    res.status(500).json({ error: 'Failed to update campaign analytics' });
  }
});

// Get campaign performance comparison
router.get('/compare', auth, async (req, res) => {
  try {
    const { campaignIds } = req.query;
    
    if (!campaignIds) {
      return res.status(400).json({ error: 'Campaign IDs are required' });
    }

    const ids = campaignIds.split(',');
    const campaigns = await Promise.all(
      ids.map(id => analyticsService.getCampaignPerformance(id))
    );

    res.json({ campaigns });
  } catch (error) {
    console.error('Error comparing campaigns:', error);
    res.status(500).json({ error: 'Failed to compare campaigns' });
  }
});

// Get top performing campaigns
router.get('/top-campaigns', async (req, res) => {
  try {
    const { limit = 10, metric = 'openRate' } = req.query;
    
    const campaigns = await Campaign.find({ status: 'sent' })
      .sort({ [`analytics.${metric}`]: -1 })
      .limit(parseInt(limit))
      .select('name subject analytics createdAt sentAt');

    res.json({ campaigns });
  } catch (error) {
    console.error('Error fetching top campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch top campaigns' });
  }
});

// Get email logs with analytics
router.get('/logs/:campaignId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const query = { campaignId: req.params.campaignId };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const logs = await EmailLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmailLog.countDocuments(query);

    // Calculate additional metrics
    const statusCounts = await EmailLog.aggregate([
      { $match: { campaignId: mongoose.Types.ObjectId(req.params.campaignId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      statusCounts: statusCounts.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// Get real-time campaign stats
router.get('/realtime/:campaignId', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get recent events from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = await EmailLog.aggregate([
      {
        $match: {
          campaignId: mongoose.Types.ObjectId(req.params.campaignId),
          'events.timestamp': { $gte: oneHourAgo }
        }
      },
      { $unwind: '$events' },
      {
        $match: {
          'events.timestamp': { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: '$events.eventType',
          count: { $sum: 1 }
        }
      }
    ]);

    const realtimeStats = recentEvents.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      campaignId: campaign._id,
      campaignName: campaign.name,
      status: campaign.status,
      analytics: campaign.analytics,
      realtimeStats,
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Error fetching real-time stats:', error);
    res.status(500).json({ error: 'Failed to fetch real-time stats' });
  }
});

// Export analytics data
router.get('/export/:campaignId', auth, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const campaign = await Campaign.findById(req.params.campaignId)
      .populate('templateId');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const analytics = await CampaignAnalytics.findOne({ campaignId: req.params.campaignId });
    const logs = await EmailLog.find({ campaignId: req.params.campaignId })
      .populate('userId', 'name email role');

    const exportData = {
      campaign: {
        name: campaign.name,
        subject: campaign.subject,
        template: campaign.templateId?.name,
        status: campaign.status,
        createdAt: campaign.createdAt,
        sentAt: campaign.sentAt,
        completedAt: campaign.completedAt
      },
      analytics: campaign.analytics,
      detailedAnalytics: analytics,
      logs: logs.map(log => ({
        email: log.email,
        userName: log.userId?.name,
        userRole: log.userId?.role,
        status: log.status,
        sentAt: log.sentAt,
        deliveredAt: log.deliveredAt,
        openedAt: log.openedAt,
        clickedAt: log.clickedAt,
        events: log.events
      }))
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="campaign-${campaign.name}-analytics.csv"`);
      res.send(csv);
    } else {
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Failed to export analytics' });
  }
});

// Get all campaigns with email status breakdown
router.get('/campaigns-status', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: { $in: ['sent', 'sending', 'completed'] } })
      .sort({ sentAt: -1 })
      .select('name subject status sentAt analytics')
      .lean();

    const campaignsWithStatus = await Promise.all(
      campaigns.map(async (campaign) => {
        const statusCounts = await EmailLog.aggregate([
          { $match: { campaignId: campaign._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const statusBreakdown = statusCounts.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {});

        return {
          ...campaign,
          statusBreakdown
        };
      })
    );

    // Also get direct emails (without campaign)
    const directEmailCounts = await EmailLog.aggregate([
      { $match: { campaignId: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const directEmailBreakdown = directEmailCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const totalDirectEmails = Object.values(directEmailBreakdown).reduce((a, b) => a + b, 0);

    if (totalDirectEmails > 0) {
      campaignsWithStatus.push({
        _id: 'direct',
        name: 'Direct Emails (No Campaign)',
        subject: 'Individual emails sent directly to contacts',
        status: 'sent',
        sentAt: new Date(),
        isDirect: true,
        statusBreakdown: directEmailBreakdown
      });
    }

    res.json({ campaigns: campaignsWithStatus });
  } catch (error) {
    console.error('Error fetching campaigns status:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns status' });
  }
});

// Helper function to convert to CSV
function convertToCSV(data) {
  const headers = [
    'Email', 'User Name', 'User Role', 'Status', 'Sent At', 
    'Delivered At', 'Opened At', 'Clicked At'
  ];
  
  const rows = data.logs.map(log => [
    log.email,
    log.userName || '',
    log.userRole || '',
    log.status,
    log.sentAt ? log.sentAt.toISOString() : '',
    log.deliveredAt ? log.deliveredAt.toISOString() : '',
    log.openedAt ? log.openedAt.toISOString() : '',
    log.clickedAt ? log.clickedAt.toISOString() : ''
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

module.exports = router;
