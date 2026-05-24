const express = require("express");
const router = express.Router();
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const EmailLog = require('../models/EmailLog');

// Get CRM statistics
router.get('/stats', async (req, res) => {
  try {
    // Get total contacts (users)
    const totalContacts = await User.countDocuments();
    
    // Get active leads (users who received emails but haven't converted)
    const activeLeads = await EmailLog.distinct('userId', {
      status: { $in: ['delivered', 'opened'] }
    }).then(userIds => userIds.length);
    
    // Get opportunities (active campaigns)
    const opportunities = await Campaign.countDocuments({ 
      status: { $in: ['scheduled', 'sending', 'sent'] }
    });
    
    // Get won deals (completed campaigns)
    const wonDeals = await Campaign.countDocuments({ 
      status: 'sent',
      'analytics.sent': { $gt: 0 }
    });

    res.json({
      totalContacts,
      activeLeads,
      opportunities,
      wonDeals
    });
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    res.status(500).json({ error: 'Failed to fetch CRM statistics' });
  }
});

// Get lead pipeline
router.get('/pipeline', async (req, res) => {
  try {
    // Get campaign statistics for pipeline
    const totalCampaigns = await Campaign.countDocuments();
    const draftCampaigns = await Campaign.countDocuments({ status: 'draft' });
    const scheduledCampaigns = await Campaign.countDocuments({ status: 'scheduled' });
    const sendingCampaigns = await Campaign.countDocuments({ status: 'sending' });
    const sentCampaigns = await Campaign.countDocuments({ status: 'sent' });

    const total = totalCampaigns;
    
    const stages = [
      {
        name: 'New',
        count: draftCampaigns,
        percentage: total > 0 ? Math.round((draftCampaigns / total) * 100) : 0,
        color: '#6c757d'
      },
      {
        name: 'Qualified',
        count: scheduledCampaigns,
        percentage: total > 0 ? Math.round((scheduledCampaigns / total) * 100) : 0,
        color: '#17a2b8'
      },
      {
        name: 'Proposition',
        count: sendingCampaigns,
        percentage: total > 0 ? Math.round((sendingCampaigns / total) * 100) : 0,
        color: '#ffc107'
      },
      {
        name: 'Negotiation',
        count: sentCampaigns,
        percentage: total > 0 ? Math.round((sentCampaigns / total) * 100) : 0,
        color: '#28a745'
      }
    ];

    res.json({ stages });
  } catch (error) {
    console.error('Error fetching lead pipeline:', error);
    res.status(500).json({ error: 'Failed to fetch lead pipeline' });
  }
});

// Get recent activities
router.get('/activities', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    // Get recent campaigns as activities
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('name subject status createdAt analytics.sent analytics.opened analytics.clicked');

    const activities = campaigns.map(campaign => ({
      _id: campaign._id,
      title: campaign.name,
      description: `Subject: ${campaign.subject} | Status: ${campaign.status}`,
      type: campaign.status,
      createdAt: campaign.createdAt
    }));

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Create new contact
router.post('/contacts', async (req, res) => {
  try {
    const { name, email, role, university, skills } = req.body;
    
    const newContact = new User({
      name,
      email,
      role: role || 'Student',
      university,
      skills: skills || []
    });

    await newContact.save();
    res.status(201).json(newContact);
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Create new lead
router.post('/leads', async (req, res) => {
  try {
    const { name, email, source, status, notes } = req.body;
    
    // Create a lead as a campaign with lead status
    const newLead = new Campaign({
      name: `Lead: ${name}`,
      subject: `Lead from ${source}`,
      description: notes,
      status: 'draft',
      segments: [
        {
          type: 'custom',
          criteria: { emails: [email] }
        }
      ],
      createdBy: '507f1f77bcf86cd799439011'
    });

    await newLead.save();
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Get contacts list
router.get('/contacts', async (req, res) => {
  try {
    const { limit = 20, page = 1, search } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { skills: { $regex: search, $options: 'i' } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const contacts = await User.find(query)
      .select('name email role university skills Points rating createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    
    res.json({
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get single contact
router.get('/contacts/:id', async (req, res) => {
  try {
    const contact = await User.findById(req.params.id)
      .select('name userName firstName lastName email role university skills Points rating createdAt lastEmailSent emailPreferences');
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Delete contact
router.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await User.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

// Import contacts
router.post('/import', async (req, res) => {
  try {
    const { contacts } = req.body;
    
    if (!Array.isArray(contacts)) {
      return res.status(400).json({ error: 'Contacts must be an array' });
    }

    const importedContacts = [];
    
    for (const contact of contacts) {
      try {
        const newContact = new User({
          name: contact.name,
          email: contact.email,
          role: contact.role || 'Student',
          university: contact.university,
          skills: contact.skills || []
        });
        
        await newContact.save();
        importedContacts.push(newContact);
      } catch (error) {
        console.error('Error importing contact:', contact.email, error);
      }
    }

    res.status(201).json({
      message: `Successfully imported ${importedContacts.length} contacts`,
      imported: importedContacts.length,
      total: contacts.length
    });
  } catch (error) {
    console.error('Error importing contacts:', error);
    res.status(500).json({ error: 'Failed to import contacts' });
  }
});

module.exports = router;
