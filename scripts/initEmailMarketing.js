const mongoose = require('mongoose');
const dotenv = require('dotenv');
const templateService = require('../services/templateService');
const TemplateServiceMonthly = require('../services/templateServiceMonthly');
const EmailTemplate = require('../models/EmailTemplate');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

// Load environment variables
dotenv.config({ path: './config/config.env' });

async function initializeEmailMarketing() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    console.log('// Create default templates');
    const createdTemplates = await templateService.createDefaultTemplates();
    const monthlyTemplates = await TemplateServiceMonthly.createDefaultTemplates();
    console.log(`Created ${createdTemplates.length + monthlyTemplates.length} default templates`);

    // Create sample campaigns after templates are created
    await createSampleCampaigns();

    console.log('Email marketing initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing email marketing:', error);
    process.exit(1);
  }
}

async function createSampleCampaigns() {
  try {
    console.log('Creating sample campaigns...');

    // Find a system admin user or create a placeholder
    let adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      // Find any user to use as creator
      adminUser = await User.findOne();
      if (!adminUser) {
        console.log('No users found, skipping sample campaign creation');
        return;
      }
    }

    const welcomeTemplate = await EmailTemplate.findOne({ name: 'Welcome Email' });
    const weeklyDigestTemplate = await EmailTemplate.findOne({ name: 'Weekly Digest' });
    const courseRecommendationsTemplate = await EmailTemplate.findOne({ name: 'Course Recommendations' });

    if (!welcomeTemplate || !weeklyDigestTemplate || !courseRecommendationsTemplate) {
      console.log('Templates not found, skipping sample campaign creation');
      return;
    }

    // Sample campaigns
    const sampleCampaigns = [
      {
        name: 'Welcome Series - New Students',
        subject: 'Welcome to EduNode - Start Your Learning Journey!',
        templateId: welcomeTemplate._id,
        segments: [
          {
            type: 'role',
            criteria: { roles: ['Student'] }
          },
          {
            type: 'activity',
            criteria: { lastLoginDays: 7 }
          }
        ],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdBy: adminUser._id,
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true,
          batchSize: 50,
          delayBetweenBatches: 2000
        }
      },
      {
        name: 'Weekly Digest - All Users',
        subject: 'Your Weekly EduNode Digest',
        templateId: weeklyDigestTemplate._id,
        segments: [
          {
            type: 'activity',
            criteria: { lastLoginDays: 30 }
          }
        ],
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        createdBy: adminUser._id,
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true,
          batchSize: 100,
          delayBetweenBatches: 1000
        }
      },
      {
        name: 'Course Recommendations - Active Students',
        subject: 'Recommended Courses for You on EduNode',
        templateId: courseRecommendationsTemplate._id,
        segments: [
          {
            type: 'role',
            criteria: { roles: ['Student'] }
          },
          {
            type: 'skills',
            criteria: { 
              skills: ['JavaScript', 'Web Development', 'Python'],
              matchType: 'any'
            }
          },
          {
            type: 'activity',
            criteria: { 
              lastLoginDays: 14,
              minPoints: 500
            }
          }
        ],
        createdBy: adminUser._id,
        settings: {
          trackOpens: true,
          trackClicks: true,
          unsubscribeLink: true,
          batchSize: 75,
          delayBetweenBatches: 1500
        }
      }
    ];

    for (const campaignData of sampleCampaigns) {
      const existingCampaign = await Campaign.findOne({ name: campaignData.name });
      if (!existingCampaign) {
        const campaign = new Campaign(campaignData);
        await campaign.save();
        console.log(`Created sample campaign: ${campaign.name}`);
      } else {
        console.log(`Campaign already exists: ${existingCampaign.name}`);
      }
    }

  } catch (error) {
    console.error('Error creating sample campaigns:', error);
  }
}

// Run the initialization
if (require.main === module) {
  initializeEmailMarketing();
}

module.exports = { initializeEmailMarketing, createSampleCampaigns };
