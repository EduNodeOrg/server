const express = require("express");
const router = express.Router();
const EmailTemplate = require('../models/EmailTemplate');
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, category, search, isActive } = req.query;
    const query = {};
    
    if (category) {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const templates = await EmailTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EmailTemplate.countDocuments(query);

    res.json({
      templates,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create new template
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      variables,
      previewText
    } = req.body;

    const template = new EmailTemplate({
      name,
      description,
      subject,
      htmlContent,
      textContent,
      category,
      variables,
      previewText,
      createdBy: req.user.id
    });

    await template.save();
    
    const populatedTemplate = await EmailTemplate.findById(template._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', auth, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user can edit this template
    if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to edit this template' });
    }

    // Check if template is used in active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      templateId: req.params.id,
      status: { $in: ['draft', 'scheduled', 'sending'] }
    });

    if (activeCampaigns > 0) {
      return res.status(400).json({ 
        error: 'Cannot edit template used in active campaigns' 
      });
    }

    const updates = req.body;
    
    // Increment version if content changed
    if (updates.htmlContent || updates.textContent || updates.subject) {
      updates.version = template.version + 1;
    }
    
    Object.assign(template, updates);
    await template.save();

    const updatedTemplate = await EmailTemplate.findById(template._id)
      .populate('createdBy', 'name email');

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Check if user can delete this template
    if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this template' });
    }

    // Check if template is used in any campaigns
    const campaignCount = await Campaign.countDocuments({
      templateId: req.params.id
    });

    if (campaignCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete template used in campaigns' 
      });
    }

    await EmailTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Duplicate template
router.post('/:id/duplicate', auth, async (req, res) => {
  try {
    const originalTemplate = await EmailTemplate.findById(req.params.id);
    
    if (!originalTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const duplicatedTemplate = new EmailTemplate({
      name: `${originalTemplate.name} (Copy)`,
      description: originalTemplate.description,
      subject: originalTemplate.subject,
      htmlContent: originalTemplate.htmlContent,
      textContent: originalTemplate.textContent,
      category: originalTemplate.category,
      variables: originalTemplate.variables,
      previewText: originalTemplate.previewText,
      isActive: false, // Start as inactive
      createdBy: req.user.id,
      version: 1
    });

    await duplicatedTemplate.save();
    
    const populatedTemplate = await EmailTemplate.findById(duplicatedTemplate._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTemplate);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(500).json({ error: 'Failed to duplicate template' });
  }
});

// Preview template with sample data
router.post('/:id/preview', auth, async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { sampleData } = req.body;
    
    // Default sample data
    const defaultSampleData = {
      user: {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Student',
        university: 'EduNode University'
      },
      campaign: {
        name: 'Sample Campaign',
        subject: 'Sample Subject'
      },
      ...sampleData
    };

    const emailService = require('../services/emailService');
    const renderedEmail = await emailService.renderTemplate(template, defaultSampleData);
    const renderedSubject = emailService.renderSubject(template.subject, defaultSampleData);

    res.json({
      subject: renderedSubject,
      html: renderedEmail.html,
      text: renderedEmail.text
    });
  } catch (error) {
    console.error('Error previewing template:', error);
    res.status(500).json({ error: 'Failed to preview template' });
  }
});

// Get template categories
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = await EmailTemplate.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
