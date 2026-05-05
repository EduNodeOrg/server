const express = require("express");
const router = express.Router();
const Campaign = require('../models/Campaign');
const EmailTemplate = require('../models/EmailTemplate');
const EmailLog = require('../models/EmailLog');
const CampaignAnalytics = require('../models/CampaignAnalytics');
const User = require('../models/User');
const Unsubscribe = require('../models/Unsubscribe');
const emailService = require('../services/emailService');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    const campaigns = await Campaign.find(query)
      .populate('templateId', 'name category')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Campaign.countDocuments(query);

    res.json({
      campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Get single campaign
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('templateId')
      .populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Create new campaign
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      subject,
      templateId,
      segments,
      scheduledAt,
      settings
    } = req.body;

    // Validate template exists
    const template = await EmailTemplate.findById(templateId);
    if (!template) {
      return res.status(400).json({ error: 'Template not found' });
    }

    const campaign = new Campaign({
      name,
      subject,
      templateId,
      segments,
      scheduledAt,
      settings,
      createdBy: req.user.id
    });

    await campaign.save();
    
    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate('templateId')
      .populate('createdBy', 'name email');

    res.status(201).json(populatedCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if user can edit this campaign
    if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this campaign' });
    }

    // Don't allow editing sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Cannot edit sent campaign' });
    }

    const updates = req.body;
    Object.assign(campaign, updates);
    await campaign.save();

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate('templateId')
      .populate('createdBy', 'name email');

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if user can delete this campaign
    if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this campaign' });
    }

    // Don't allow deleting sent campaigns
    if (campaign.status === 'sent') {
      return res.status(400).json({ error: 'Cannot delete sent campaign' });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// Send campaign
router.post('/:id/send', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate('templateId');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Check if user can send this campaign
    if (campaign.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to send this campaign' });
    }

    // Don't allow sending already sent campaigns
    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({ error: 'Campaign already sent or currently sending' });
    }

    // Get segmented users
    const { userIds, totalRecipients } = await getSegmentedUsers(campaign.segments);
    
    if (userIds.length === 0) {
      return res.status(400).json({ error: 'No users found for the selected segments' });
    }

    // Update campaign with recipient count
    campaign.analytics.totalRecipients = totalRecipients;
    await campaign.save();

    // Start sending campaign in background
    emailService.processCampaignBatch(campaign._id, userIds, campaign.settings.batchSize)
      .then(results => {
        console.log(`Campaign ${campaign._id} sent:`, results);
      })
      .catch(error => {
        console.error(`Campaign ${campaign._id} failed:`, error);
      });

    res.json({ 
      message: 'Campaign sending started',
      totalRecipients,
      campaignId: campaign._id
    });

  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ error: 'Failed to send campaign' });
  }
});

// Get campaign analytics
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const analytics = await CampaignAnalytics.findOne({ campaignId: req.params.id })
      .populate('campaignId', 'name subject');

    if (!analytics) {
      // Create initial analytics if doesn't exist
      const newAnalytics = new CampaignAnalytics({
        campaignId: req.params.id
      });
      await newAnalytics.save();
      res.json(newAnalytics);
    } else {
      res.json(analytics);
    }

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get campaign email logs
router.get('/:id/logs', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50, status, search } = req.query;
    const query = { campaignId: req.params.id };
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const logs = await EmailLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmailLog.countDocuments(query);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Helper function to get segmented users
async function getSegmentedUsers(segments) {
  let query = { 
    email: { $exists: true, $ne: null },
    isVerified: true,
    'emailPreferences.marketing': true
  };

  for (const segment of segments) {
    switch (segment.type) {
      case 'role':
        if (segment.criteria.roles && segment.criteria.roles.length > 0) {
          query.role = { $in: segment.criteria.roles };
        }
        break;
      
      case 'activity':
        if (segment.criteria.lastLoginDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - segment.criteria.lastLoginDays);
          query.date = { $gte: cutoffDate };
        }
        if (segment.criteria.minPoints) {
          query.Points = { $gte: segment.criteria.minPoints };
        }
        break;
      
      case 'skills':
        if (segment.criteria.skills && segment.criteria.skills.length > 0) {
          query.skills = { $in: segment.criteria.skills };
        }
        break;
      
      case 'preferences':
        if (segment.criteria.preferences && segment.criteria.preferences.length > 0) {
          query.preferences = { $in: segment.criteria.preferences };
        }
        break;
      
      case 'location':
        if (segment.criteria.locations && segment.criteria.locations.length > 0) {
          query.location = { $in: segment.criteria.locations };
        }
        break;
      
      case 'custom':
        if (segment.criteria.customQuery) {
          Object.assign(query, segment.criteria.customQuery);
        }
        break;
    }
  }

  const users = await User.find(query).select('_id email');
  const userIds = users.map(user => user._id);
  
  // Remove unsubscribed users
  const unsubscribedEmails = await Unsubscribe.find({}, 'email');
  const unsubscribedSet = new Set(unsubscribedEmails.map(u => u.email));
  
  const filteredUsers = users.filter(user => !unsubscribedSet.has(user.email));
  const filteredUserIds = filteredUsers.map(user => user._id);

  return {
    userIds: filteredUserIds,
    totalRecipients: users.length
  };
}

module.exports = router;
