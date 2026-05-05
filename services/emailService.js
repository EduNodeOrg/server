const formData = require('form-data');
const Mailgun = require('mailgun.js');
const EmailLog = require('../models/EmailLog');
const Unsubscribe = require('../models/Unsubscribe');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const mailgun = new Mailgun(formData);
const domain = "edunode.org";
const mg = mailgun.client({
  username: 'api', 
  key: process.env.MAILGUN_API_KEY || "key-c8d12b7428fbe666e074108aaa0820bc",
  url: 'https://api.eu.mailgun.net'
});

class EmailService {
  constructor() {
    this.queue = [];
    this.sending = false;
  }

  async sendCampaignEmail(campaignId, userId, templateData) {
    try {
      const campaign = await Campaign.findById(campaignId).populate('templateId');
      const user = await User.findById(userId);
      
      if (!campaign || !user) {
        throw new Error('Campaign or user not found');
      }

      // Check if user is unsubscribed
      const unsubscribe = await Unsubscribe.findOne({ email: user.email });
      if (unsubscribe) {
        return { status: 'unsubscribed', message: 'User has unsubscribed' };
      }

      // Check user email preferences
      if (!user.emailPreferences?.marketing) {
        return { status: 'blocked', message: 'User has opted out of marketing emails' };
      }

      // Check email frequency
      if (user.emailFrequency === 'never') {
        return { status: 'blocked', message: 'User has disabled emails' };
      }

      // Check if recently sent
      if (user.lastEmailSent) {
        const daysSinceLastEmail = (Date.now() - user.lastEmailSent) / (1000 * 60 * 60 * 24);
        const minDays = user.emailFrequency === 'daily' ? 1 : 
                       user.emailFrequency === 'weekly' ? 7 : 
                       user.emailFrequency === 'monthly' ? 30 : 0;
        
        if (daysSinceLastEmail < minDays) {
          return { status: 'blocked', message: 'Email frequency limit reached' };
        }
      }

      // Render template
      const renderedEmail = await this.renderTemplate(campaign.templateId, {
        user,
        campaign,
        ...templateData
      });

      // Prepare email data
      const emailData = {
        from: 'EduNode <hi@edunode.org>',
        to: user.email,
        subject: this.renderSubject(campaign.templateId.subject, { user, campaign, ...templateData }),
        html: renderedEmail.html,
        text: renderedEmail.text,
        'o:tracking': campaign.settings.trackOpens,
        'o:tracking-clicks': campaign.settings.trackClicks,
        'v:campaign-id': campaignId.toString(),
        'v:user-id': userId.toString()
      };

      // Add unsubscribe link if enabled
      if (campaign.settings.unsubscribeLink) {
        emailData['h:List-Unsubscribe'] = `<https://edunode.org/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&campaign=${campaignId}>`;
        emailData['h:Unsubscribe-Link'] = `https://edunode.org/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&campaign=${campaignId}`;
      }

      // Send email
      const result = await mg.messages.create(domain, emailData);

      // Create email log
      const emailLog = new EmailLog({
        campaignId,
        userId,
        email: user.email,
        messageId: result.id,
        status: 'sent',
        sentAt: new Date(),
        templateData
      });

      await emailLog.save();

      // Update user's last email sent
      await User.findByIdAndUpdate(userId, { lastEmailSent: new Date() });

      // Update campaign analytics
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { 'analytics.sent': 1 }
      });

      return { 
        success: true, 
        messageId: result.id,
        emailLogId: emailLog._id
      };

    } catch (error) {
      console.error('Error sending campaign email:', error);
      
      // Log failed attempt
      const emailLog = new EmailLog({
        campaignId,
        userId,
        email: user?.email || 'unknown',
        status: 'failed',
        templateData
      });
      await emailLog.save();

      throw error;
    }
  }

  async renderTemplate(template, data) {
    const { htmlContent, textContent } = template;
    
    const renderString = (str, data) => {
      return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const keys = key.split('.');
        let value = data;
        for (const k of keys) {
          value = value?.[k];
        }
        return value !== undefined ? value : match;
      });
    };

    return {
      html: renderString(htmlContent, data),
      text: textContent ? renderString(textContent, data) : ''
    };
  }

  renderSubject(subject, data) {
    return subject.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const keys = key.split('.');
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value !== undefined ? value : match;
    });
  }

  async processCampaignBatch(campaignId, userIds, batchSize = 100) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    const results = {
      sent: 0,
      failed: 0,
      blocked: 0,
      unsubscribed: 0,
      errors: []
    };

    // Update campaign status to sending
    await Campaign.findByIdAndUpdate(campaignId, { 
      status: 'sending',
      sentAt: new Date()
    });

    try {
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (userId) => {
          try {
            const result = await this.sendCampaignEmail(campaignId, userId);
            
            if (result.success) {
              results.sent++;
            } else if (result.status === 'unsubscribed') {
              results.unsubscribed++;
            } else if (result.status === 'blocked') {
              results.blocked++;
            }
            
            return result;
          } catch (error) {
            results.failed++;
            results.errors.push({
              userId,
              error: error.message
            });
            return null;
          }
        });

        await Promise.all(batchPromises);

        // Add delay between batches to respect rate limits
        if (i + batchSize < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, campaign.settings.delayBetweenBatches));
        }
      }

      // Update campaign status and analytics
      await Campaign.findByIdAndUpdate(campaignId, {
        status: 'sent',
        completedAt: new Date(),
        $inc: {
          'analytics.sent': results.sent,
          'analytics.delivered': results.sent
        }
      });

      return results;

    } catch (error) {
      // Update campaign status to failed
      await Campaign.findByIdAndUpdate(campaignId, { 
        status: 'draft',
        $push: { 'errors': error.message }
      });
      throw error;
    }
  }

  async handleWebhook(eventType, data) {
    try {
      const { 'campaign-id': campaignId, 'user-id': userId, message: { headers: { 'message-id': messageId } } } = data;

      if (!campaignId || !userId || !messageId) {
        return { success: false, message: 'Missing required webhook data' };
      }

      const emailLog = await EmailLog.findOne({
        campaignId,
        userId,
        messageId
      });

      if (!emailLog) {
        return { success: false, message: 'Email log not found' };
      }

      // Add event to email log
      emailLog.events.push({
        eventType,
        timestamp: new Date(),
        data
      });

      // Update status and timestamps
      switch (eventType) {
        case 'delivered':
          emailLog.status = 'delivered';
          emailLog.deliveredAt = new Date();
          break;
        case 'opened':
          emailLog.status = 'opened';
          emailLog.openedAt = new Date();
          break;
        case 'clicked':
          emailLog.status = 'clicked';
          emailLog.clickedAt = new Date();
          break;
        case 'bounced':
          emailLog.status = 'bounced';
          emailLog.bouncedAt = new Date();
          emailLog.bounceReason = data.reason || 'Unknown';
          break;
        case 'unsubscribed':
          emailLog.status = 'unsubscribed';
          emailLog.unsubscribedAt = new Date();
          
          // Create unsubscribe record
          await Unsubscribe.create({
            email: emailLog.email,
            userId,
            campaignId
          });
          break;
        case 'complained':
          emailLog.status = 'complained';
          emailLog.complaintReason = data.reason || 'Spam complaint';
          break;
      }

      await emailLog.save();

      // Update campaign analytics
      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { [`analytics.${eventType}`]: 1 }
      });

      return { success: true };

    } catch (error) {
      console.error('Error handling webhook:', error);
      return { success: false, error: error.message };
    }
  }

  async unsubscribeUser(email, campaignId, reason = 'user_request') {
    try {
      // Create unsubscribe record
      const unsubscribe = await Unsubscribe.findOneAndUpdate(
        { email },
        {
          email,
          campaignId,
          reason,
          unsubscribedAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Update user preferences
      await User.findOneAndUpdate(
        { email },
        { 
          'emailPreferences.marketing': false,
          'emailPreferences.newsletters': false,
          'emailPreferences.updates': false
        }
      );

      return { success: true, unsubscribe };

    } catch (error) {
      console.error('Error unsubscribing user:', error);
      throw error;
    }
  }
}

module.exports = new EmailService();
