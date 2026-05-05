const CampaignAnalytics = require('../models/CampaignAnalytics');
const EmailLog = require('../models/EmailLog');
const Campaign = require('../models/Campaign');
const User = require('../models/User');

class AnalyticsService {
  
  async updateCampaignAnalytics(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Get all email logs for this campaign
      const emailLogs = await EmailLog.find({ campaignId });
      
      // Calculate basic metrics
      const analytics = {
        totalRecipients: emailLogs.length,
        sent: emailLogs.filter(log => log.status === 'sent').length,
        delivered: emailLogs.filter(log => log.status === 'delivered').length,
        opened: emailLogs.filter(log => log.status === 'opened').length,
        clicked: emailLogs.filter(log => log.status === 'clicked').length,
        bounced: emailLogs.filter(log => log.status === 'bounced').length,
        unsubscribed: emailLogs.filter(log => log.status === 'unsubscribed').length,
        complaints: emailLogs.filter(log => log.status === 'complained').length
      };

      // Calculate rates
      analytics.deliveryRate = analytics.totalRecipients > 0 ? (analytics.delivered / analytics.totalRecipients * 100).toFixed(2) : 0;
      analytics.openRate = analytics.delivered > 0 ? (analytics.opened / analytics.delivered * 100).toFixed(2) : 0;
      analytics.clickRate = analytics.opened > 0 ? (analytics.clicked / analytics.opened * 100).toFixed(2) : 0;
      analytics.bounceRate = analytics.totalRecipients > 0 ? (analytics.bounced / analytics.totalRecipients * 100).toFixed(2) : 0;
      analytics.unsubscribeRate = analytics.delivered > 0 ? (analytics.unsubscribed / analytics.delivered * 100).toFixed(2) : 0;

      // Update campaign with new analytics
      await Campaign.findByIdAndUpdate(campaignId, { analytics });

      // Update detailed analytics
      await this.updateDetailedAnalytics(campaignId, emailLogs);

      return analytics;
    } catch (error) {
      console.error('Error updating campaign analytics:', error);
      throw error;
    }
  }

  async updateDetailedAnalytics(campaignId, emailLogs) {
    try {
      let analyticsDoc = await CampaignAnalytics.findOne({ campaignId });
      
      if (!analyticsDoc) {
        analyticsDoc = new CampaignAnalytics({ campaignId });
      }

      // Daily stats
      const dailyStats = this.calculateDailyStats(emailLogs);
      analyticsDoc.dailyStats = dailyStats;

      // Segment performance
      const segmentPerformance = await this.calculateSegmentPerformance(campaignId, emailLogs);
      analyticsDoc.segmentPerformance = segmentPerformance;

      // Link tracking
      const linkTracking = this.calculateLinkTracking(emailLogs);
      analyticsDoc.linkTracking = linkTracking;

      // Geographic data
      const geographicData = await this.calculateGeographicData(emailLogs);
      analyticsDoc.geographicData = geographicData;

      // Device data
      const deviceData = this.calculateDeviceData(emailLogs);
      analyticsDoc.deviceData = deviceData;

      // Time data
      const timeData = this.calculateTimeData(emailLogs);
      analyticsDoc.timeData = timeData;

      await analyticsDoc.save();
      return analyticsDoc;
    } catch (error) {
      console.error('Error updating detailed analytics:', error);
      throw error;
    }
  }

  calculateDailyStats(emailLogs) {
    const dailyMap = new Map();

    emailLogs.forEach(log => {
      const date = log.createdAt.toISOString().split('T')[0];
      
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date: new Date(date),
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          unsubscribed: 0
        });
      }

      const dayStats = dailyMap.get(date);
      dayStats[log.status]++;
    });

    return Array.from(dailyMap.values());
  }

  async calculateSegmentPerformance(campaignId, emailLogs) {
    const segmentPerformance = [];
    
    // Group by user role
    const roleStats = new Map();
    
    for (const log of emailLogs) {
      const user = await User.findById(log.userId);
      if (!user) continue;

      const role = user.role || 'unknown';
      
      if (!roleStats.has(role)) {
        roleStats.set(role, {
          segmentType: 'role',
          segmentValue: role,
          totalRecipients: 0,
          delivered: 0,
          opened: 0,
          clicked: 0
        });
      }

      const stats = roleStats.get(role);
      stats.totalRecipients++;
      
      if (log.status === 'delivered') stats.delivered++;
      if (log.status === 'opened') stats.opened++;
      if (log.status === 'clicked') stats.clicked++;
    }

    // Calculate rates
    for (const stats of roleStats.values()) {
      stats.openRate = stats.delivered > 0 ? (stats.opened / stats.delivered * 100).toFixed(2) : 0;
      stats.clickRate = stats.opened > 0 ? (stats.clicked / stats.opened * 100).toFixed(2) : 0;
    }

    return Array.from(roleStats.values());
  }

  calculateLinkTracking(emailLogs) {
    const linkStats = new Map();

    emailLogs.forEach(log => {
      log.events.forEach(event => {
        if (event.eventType === 'clicked' && event.data?.url) {
          const url = event.data.url;
          linkStats.set(url, (linkStats.get(url) || 0) + 1);
        }
      });
    });

    return Array.from(linkStats.entries()).map(([url, clicks]) => ({
      url,
      clicks,
      uniqueClicks: clicks // Simplified - would need more complex logic for unique clicks
    }));
  }

  async calculateGeographicData(emailLogs) {
    const geoStats = new Map();

    // This is a simplified version - in production, you'd use IP geolocation
    emailLogs.forEach(log => {
      const user = User.findById(log.userId);
      const location = user?.location || 'unknown';
      
      if (!geoStats.has(location)) {
        geoStats.set(location, { country: location, opens: 0, clicks: 0 });
      }

      const stats = geoStats.get(location);
      if (log.status === 'opened') stats.opens++;
      if (log.status === 'clicked') stats.clicks++;
    });

    return Array.from(geoStats.values());
  }

  calculateDeviceData(emailLogs) {
    const deviceStats = new Map();

    emailLogs.forEach(log => {
      log.events.forEach(event => {
        if (event.eventType === 'opened' && event.data?.deviceType) {
          const deviceType = event.data.deviceType;
          deviceStats.set(deviceType, (deviceStats.get(deviceType) || { deviceType, opens: 0, clicks: 0 }));
          
          const stats = deviceStats.get(deviceType);
          if (event.eventType === 'opened') stats.opens++;
          if (event.eventType === 'clicked') stats.clicks++;
        }
      });
    });

    // Ensure all device types are present
    ['desktop', 'mobile', 'tablet', 'unknown'].forEach(deviceType => {
      if (!deviceStats.has(deviceType)) {
        deviceStats.set(deviceType, { deviceType, opens: 0, clicks: 0 });
      }
    });

    return Array.from(deviceStats.values());
  }

  calculateTimeData(emailLogs) {
    const hourStats = new Map();

    // Initialize all hours
    for (let i = 0; i < 24; i++) {
      hourStats.set(i, { hour: i, opens: 0, clicks: 0 });
    }

    emailLogs.forEach(log => {
      log.events.forEach(event => {
        if (event.eventType === 'opened' || event.eventType === 'clicked') {
          const hour = new Date(event.timestamp).getHours();
          const stats = hourStats.get(hour);
          
          if (event.eventType === 'opened') stats.opens++;
          if (event.eventType === 'clicked') stats.clicks++;
        }
      });
    });

    return Array.from(hourStats.values());
  }

  async getCampaignPerformance(campaignId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      const analytics = await CampaignAnalytics.findOne({ campaignId });
      
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      return {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          subject: campaign.subject,
          status: campaign.status,
          createdAt: campaign.createdAt,
          sentAt: campaign.sentAt,
          completedAt: campaign.completedAt
        },
        analytics: campaign.analytics,
        detailedAnalytics: analytics
      };
    } catch (error) {
      console.error('Error getting campaign performance:', error);
      throw error;
    }
  }

  async getOverallAnalytics() {
    try {
      const campaigns = await Campaign.find({ status: 'sent' });
      
      const totalStats = {
        totalCampaigns: campaigns.length,
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        averageDeliveryRate: 0
      };

      let totalOpenRate = 0;
      let totalClickRate = 0;
      let totalDeliveryRate = 0;
      let validCampaigns = 0;

      campaigns.forEach(campaign => {
        const analytics = campaign.analytics;
        totalStats.totalSent += analytics.sent || 0;
        totalStats.totalDelivered += analytics.delivered || 0;
        totalStats.totalOpened += analytics.opened || 0;
        totalStats.totalClicked += analytics.clicked || 0;

        if (analytics.sent > 0) {
          const deliveryRate = (analytics.delivered / analytics.sent) * 100;
          const openRate = analytics.delivered > 0 ? (analytics.opened / analytics.delivered) * 100 : 0;
          const clickRate = analytics.opened > 0 ? (analytics.clicked / analytics.opened) * 100 : 0;

          totalDeliveryRate += deliveryRate;
          totalOpenRate += openRate;
          totalClickRate += clickRate;
          validCampaigns++;
        }
      });

      if (validCampaigns > 0) {
        totalStats.averageDeliveryRate = (totalDeliveryRate / validCampaigns).toFixed(2);
        totalStats.averageOpenRate = (totalOpenRate / validCampaigns).toFixed(2);
        totalStats.averageClickRate = (totalClickRate / validCampaigns).toFixed(2);
      }

      return totalStats;
    } catch (error) {
      console.error('Error getting overall analytics:', error);
      throw error;
    }
  }

  async getUserEngagementStats(userId) {
    try {
      const emailLogs = await EmailLog.find({ userId });
      
      const stats = {
        totalEmails: emailLogs.length,
        openedEmails: emailLogs.filter(log => log.status === 'opened').length,
        clickedEmails: emailLogs.filter(log => log.status === 'clicked').length,
        unsubscribedEmails: emailLogs.filter(log => log.status === 'unsubscribed').length,
        bouncedEmails: emailLogs.filter(log => log.status === 'bounced').length
      };

      stats.openRate = stats.totalEmails > 0 ? (stats.openedEmails / stats.totalEmails * 100).toFixed(2) : 0;
      stats.clickRate = stats.openedEmails > 0 ? (stats.clickedEmails / stats.openedEmails * 100).toFixed(2) : 0;

      return stats;
    } catch (error) {
      console.error('Error getting user engagement stats:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();
