const formData = require('form-data');
const mg = require('../utils/mailgunClient');
const EmailLog = require('../models/EmailLog');
const Unsubscribe = require('../models/Unsubscribe');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

const domain = process.env.MAILGUN_DOMAIN || 'edunode.org';

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
        console.log(`Email blocked for user ${userId}: User has unsubscribed`);
        return { status: 'unsubscribed', message: 'User has unsubscribed' };
      }

      // Check user email preferences
      if (!user.emailPreferences?.marketing) {
        console.log(`Email blocked for user ${userId}: User has opted out of marketing emails. emailPreferences:`, user.emailPreferences);
        return { status: 'blocked', message: 'User has opted out of marketing emails' };
      }

      // Check email frequency - only block if set to 'never'
      // Campaign sends bypass frequency limits since they're manually triggered by admin
      if (user.emailFrequency === 'never') {
        console.log(`Email blocked for user ${userId}: User has disabled emails. emailFrequency:`, user.emailFrequency);
        return { status: 'blocked', message: 'User has disabled emails' };
      }

      // Render template
      const unsubscribeUrl = `${process.env.BASE_URL}/api/email/unsubscribe?email=${encodeURIComponent(user.email)}&campaign=${campaignId}`;
      
      // Add name fallback to user object for template rendering
      const userWithFallback = {
        ...user.toObject(),
        email: user.email,
        name: user.name || user.userName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Valued User'
      };
      
      // Use custom template content if available, otherwise use the original template
      let templateToUse = campaign.templateId;
      if (campaign.customTemplateContent) {
        console.log(`Using customTemplateContent for campaign ${campaignId}`);
        templateToUse = {
          ...campaign.templateId.toObject(),
          htmlContent: campaign.customTemplateContent
        };
      } else {
        console.log(`Using original template for campaign ${campaignId}`);
      }
      
      const renderedEmail = await this.renderTemplate(templateToUse, {
        user: userWithFallback,
        campaign,
        unsubscribeUrl,
        ...templateData
      });

      // Prepare email data
      const emailData = {
        from: 'EduNode <hi@edunode.org>',
        to: user.email,
        subject: this.renderSubject(campaign.subject, { user, campaign, ...templateData }),
        html: renderedEmail.html,
        text: renderedEmail.text,
        'o:tracking': campaign.settings.trackOpens,
        'o:tracking-clicks': campaign.settings.trackClicks,
        'v:campaign-id': campaignId.toString(),
        'v:user-id': userId.toString()
      };

      // Add unsubscribe link if enabled
      if (campaign.settings.unsubscribeLink) {
        emailData['h:List-Unsubscribe'] = `<${unsubscribeUrl}>, <mailto:unsubscribe@edunode.org>`;
        emailData['h:Unsubscribe-Link'] = unsubscribeUrl;
        // Add direct unsubscribe link in HTML to bypass Mailgun tracking
        renderedEmail.html = renderedEmail.html.replace(
          '</body>',
          `<p style="text-align: center; margin-top: 20px;"><a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;" data-mg-track-ignore>Unsubscribe</a></p></body>`
        );
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

  async sendEmail({ to, subject, html, text, from, userId, campaignId = null }) {
    try {
      const emailData = {
        from: from || 'EduNode <hi@edunode.org>',
        to: to,
        subject: subject,
        html: html,
        text: text || '',
        'o:tracking': true,
        'o:tracking-clicks': true
      };

      const result = await mg.messages.create(domain, emailData);
      
      // Create email log entry for analytics tracking
      const emailLogData = {
        userId: userId,
        email: to,
        messageId: result.id,
        status: 'sent',
        sentAt: new Date(),
        events: [{
          eventType: 'sent',
          timestamp: new Date()
        }]
      };
      
      if (campaignId) {
        emailLogData.campaignId = campaignId;
      }
      
      const emailLog = new EmailLog(emailLogData);
      await emailLog.save();
      
      return {
        messageId: result.id,
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async renderTemplate(template, data) {
    const { htmlContent, textContent } = template;
    
    const renderString = (str, data) => {
      return str.replace(/\{\{([\w.]+)\}\}/g, (match, key) => {
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

  async processCampaignBatch(campaignId, userIds, batchSize = 100, options = {}) {
    const { skipStatusUpdate = false } = options;
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

    // Update campaign status to sending (skip for individual sends)
    if (!skipStatusUpdate) {
      await Campaign.findByIdAndUpdate(campaignId, { 
        status: 'sending',
        sentAt: new Date()
      });
    }

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
      if (!skipStatusUpdate) {
        await Campaign.findByIdAndUpdate(campaignId, {
          status: 'sent',
          completedAt: new Date(),
          $inc: {
            'analytics.sent': results.sent,
            'analytics.delivered': results.sent
          }
        });
      } else {
        // For individual sends, only increment analytics
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: {
            'analytics.sent': results.sent,
            'analytics.delivered': results.sent
          }
        });
      }

      return results;

    } catch (error) {
      // Update campaign status to failed (only for bulk sends)
      if (!skipStatusUpdate) {
        await Campaign.findByIdAndUpdate(campaignId, { 
          status: 'draft',
          $push: { 'errors': error.message }
        });
      }
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
