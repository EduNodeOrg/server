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
router.post('/', async (req, res) => {
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
      createdBy: '507f1f77bcf86cd799439011' // Default system user ObjectId
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
router.put('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const updates = req.body;

    // Only update customTemplateContent if explicitly provided
    // Don't clear it when undefined (allows partial updates)
    if (updates.customTemplateContent !== undefined) {
      campaign.customTemplateContent = updates.customTemplateContent;
    }

    // Apply other updates
    const { customTemplateContent, ...otherUpdates } = updates;
    Object.assign(campaign, otherUpdates);
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
router.delete('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

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

// Reactivate campaign
router.post('/:id/reactivate', async (req, res) => {
  try {
    console.log('Reactivate campaign request:', req.params.id);
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log('Campaign current status:', campaign.status);

    if (campaign.status !== 'sent') {
      return res.status(400).json({ error: 'Can only reactivate sent campaigns' });
    }

    campaign.status = 'draft';
    campaign.sentAt = undefined;
    campaign.completedAt = undefined;

    // Reset analytics for clean state when reactivating
    campaign.analytics = {
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0
    };

    await campaign.save();
    console.log('Campaign reactivated, new status:', campaign.status);

    const updatedCampaign = await Campaign.findById(campaign._id)
      .populate('templateId')
      .populate('createdBy', 'name email');

    res.json(updatedCampaign);
  } catch (error) {
    console.error('Error reactivating campaign:', error);
    res.status(500).json({ error: 'Failed to reactivate campaign' });
  }
});

// Send campaign
router.post('/:id/send', async (req, res) => {
  try {
    console.log('Send campaign request:', req.params.id, req.body);
    const campaign = await Campaign.findById(req.params.id).populate('templateId');

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    console.log('Campaign status:', campaign.status);

    const hasSpecificContacts = req.body.contactIds && Array.isArray(req.body.contactIds) && req.body.contactIds.length > 0;

    // Only block bulk sends (no specific contacts) for sent/sending campaigns
    // Allow individual/targeted sends regardless of status
    if (!hasSpecificContacts && (campaign.status === 'sent' || campaign.status === 'sending')) {
      return res.status(400).json({ error: 'Campaign already sent or currently sending' });
    }

    let userIds = [];
    let totalRecipients = 0;

    // If specific contactIds are provided, use those
    if (hasSpecificContacts) {
      console.log('Contact IDs provided:', req.body.contactIds);
      // Validate and convert contactIds to ObjectIds
      const mongoose = require('mongoose');
      userIds = req.body.contactIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));

      console.log('Valid user IDs:', userIds.length);

      totalRecipients = userIds.length;

      if (userIds.length === 0) {
        return res.status(400).json({ error: 'No valid contacts provided' });
      }
    } else {
      // Otherwise use segmented users
      const segmented = await getSegmentedUsers(campaign.segments);
      userIds = segmented.userIds;
      totalRecipients = segmented.totalRecipients;
      
      if (userIds.length === 0) {
        return res.status(400).json({ error: 'No users found for the selected segments' });
      }
    }

    // Update campaign with recipient count
    campaign.analytics.totalRecipients = totalRecipients;
    await campaign.save();

    // Start sending campaign in background
    // Skip status update for individual/targeted sends to allow further sends
    emailService.processCampaignBatch(campaign._id, userIds, campaign.settings.batchSize, { skipStatusUpdate: hasSpecificContacts })
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

// Send single email to contact
router.post('/send-single', async (req, res) => {
  try {
    const { to, subject, htmlContent, contactId } = req.body;
    
    if (!to || !subject || !htmlContent) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, htmlContent' });
    }
    
    // Check if email is unsubscribed
    const isUnsubscribed = await Unsubscribe.findOne({ email: to });
    if (isUnsubscribed) {
      return res.status(400).json({ error: 'This email has unsubscribed from marketing emails' });
    }
    
    // Get contact data for template rendering
    let user = null;
    if (contactId) {
      user = await User.findById(contactId).select('name userName firstName lastName email role university skills Points rating');
    }
    
    // Build template data with unsubscribe URL
    const unsubscribeUrl = `${process.env.BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(to)}`;
    
    // Render template with user data
    let renderedHtml = htmlContent;
    let renderedSubject = subject;
    
    const templateData = { unsubscribeUrl };
    
    if (user) {
      templateData.user = {
        name: user.name || user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Valued User',
        email: user.email,
        role: user.role,
        university: user.university,
        skills: user.skills,
        points: user.Points,
        rating: user.rating
      };
    }
    
    // Replace template variables (handles {{user.name}}, {{unsubscribeUrl}}, etc.)
    const replaceVars = (str) => {
      return str.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
        const keys = key.split('.');
        let value = templateData;
        for (const k of keys) {
          value = value?.[k];
        }
        return value !== undefined ? value : match;
      });
    };
    
    renderedHtml = replaceVars(renderedHtml);
    renderedSubject = replaceVars(renderedSubject);
    
    // Send email using email service
    const result = await emailService.sendEmail({
      to: to,
      subject: renderedSubject,
      html: renderedHtml,
      from: 'EduNode <hi@edunode.org>',
      userId: contactId  // Pass contactId as userId for email logging
    });
    
    // Update user's lastEmailSent if contactId provided
    if (contactId) {
      await User.findByIdAndUpdate(contactId, {
        lastEmailSent: new Date()
      });
    }
    
    res.json({ 
      message: 'Email sent successfully',
      messageId: result.messageId 
    });
    
  } catch (error) {
    console.error('Error sending single email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

module.exports = router;
