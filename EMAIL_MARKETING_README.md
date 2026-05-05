# Email Marketing System for EduNode

This document describes the comprehensive email marketing campaign system implemented for EduNode's MongoDB users.

## Overview

The email marketing system allows you to create, manage, and analyze email campaigns targeting your user base with advanced segmentation and personalization capabilities.

## Features

### 🎯 Advanced User Segmentation
- **Role-based**: Target users by Student, Teacher, University, or Admin roles
- **Activity-based**: Segment by last login date, points earned, course completion
- **Skills-based**: Target users with specific skills or skill combinations
- **Preferences-based**: Target based on user preferences and interests
- **Location-based**: Geographic targeting by location or university
- **Custom queries**: Advanced MongoDB queries for complex segmentation

### 📧 Email Templates
- **Dynamic templates**: HTML and text templates with variable substitution
- **Template categories**: Welcome, Newsletter, Promotion, Notification, Re-engagement, Course, Achievement
- **Template variables**: Define custom variables for personalization
- **Template preview**: Preview templates with sample data
- **Version control**: Track template versions and changes

### 📊 Campaign Management
- **Campaign creation**: Create campaigns with scheduling options
- **Batch sending**: Configurable batch sizes and delays for deliverability
- **Campaign scheduling**: Schedule campaigns for future delivery
- **Campaign status tracking**: Draft, Scheduled, Sending, Sent, Paused, Cancelled
- **Real-time tracking**: Monitor campaign progress in real-time

### 📈 Analytics & Reporting
- **Campaign metrics**: Sent, delivered, opened, clicked, bounced, unsubscribed
- **Performance rates**: Delivery rate, open rate, click rate, bounce rate
- **Segment performance**: Compare performance across user segments
- **Geographic data**: Track opens and clicks by location
- **Device analytics**: Monitor opens by device type
- **Time analysis**: Optimize send times with hourly engagement data
- **Export capabilities**: Export analytics data in JSON or CSV format

### 🔔 Compliance Features
- **Unsubscribe management**: One-click unsubscribe with preference center
- **Email preferences**: Granular control over email types
- **Rate limiting**: Respect user email frequency preferences
- **Bounce handling**: Automatic processing of bounced emails
- **Complaint tracking**: Handle spam complaints appropriately

## API Endpoints

### Campaigns
- `GET /api/email/campaigns` - List all campaigns
- `POST /api/email/campaigns` - Create new campaign
- `GET /api/email/campaigns/:id` - Get campaign details
- `PUT /api/email/campaigns/:id` - Update campaign
- `DELETE /api/email/campaigns/:id` - Delete campaign
- `POST /api/email/campaigns/:id/send` - Send campaign
- `GET /api/email/campaigns/:id/logs` - Get campaign email logs

### Templates
- `GET /api/email/templates` - List all templates
- `POST /api/email/templates` - Create new template
- `GET /api/email/templates/:id` - Get template details
- `PUT /api/email/templates/:id` - Update template
- `DELETE /api/email/templates/:id` - Delete template
- `POST /api/email/templates/:id/duplicate` - Duplicate template
- `POST /api/email/templates/:id/preview` - Preview template

### Analytics
- `GET /api/email/analytics/overview` - Overall analytics
- `GET /api/email/analytics/campaign/:id` - Campaign analytics
- `GET /api/email/analytics/user/:userId` - User engagement stats
- `POST /api/email/analytics/campaign/:id/update` - Update campaign analytics
- `GET /api/email/analytics/compare` - Compare campaigns
- `GET /api/email/analytics/top-campaigns` - Top performing campaigns
- `GET /api/email/analytics/export/:campaignId` - Export analytics

### Unsubscribe & Preferences
- `GET /api/email/unsubscribe` - Unsubscribe page
- `POST /api/email/unsubscribe` - Process unsubscribe
- `GET /api/email/unsubscribe/preferences` - Preference center
- `POST /api/email/unsubscribe/preferences` - Update preferences
- `GET /api/email/unsubscribe/status/:email` - Check unsubscribe status

### Webhooks
- `POST /api/email/webhooks/mailgun` - Mailgun webhook handler
- `POST /api/email/webhooks/:provider` - Generic webhook handler
- `GET /api/email/webhooks/health` - Webhook health check

## Database Schema

### Campaign Collection
```javascript
{
  name: String,
  subject: String,
  description: String,
  templateId: ObjectId,
  segments: [SegmentSchema],
  status: String, // draft, scheduled, sending, sent, paused, cancelled
  scheduledAt: Date,
  sentAt: Date,
  completedAt: Date,
  createdBy: ObjectId,
  analytics: {
    totalRecipients: Number,
    sent: Number,
    delivered: Number,
    opened: Number,
    clicked: Number,
    bounced: Number,
    unsubscribed: Number,
    complaints: Number
  },
  settings: {
    trackOpens: Boolean,
    trackClicks: Boolean,
    unsubscribeLink: Boolean,
    batchSize: Number,
    delayBetweenBatches: Number
  }
}
```

### EmailTemplate Collection
```javascript
{
  name: String,
  description: String,
  subject: String,
  htmlContent: String,
  textContent: String,
  category: String,
  variables: [VariableSchema],
  isActive: Boolean,
  createdBy: ObjectId,
  version: Number,
  previewText: String
}
```

### EmailLog Collection
```javascript
{
  campaignId: ObjectId,
  userId: ObjectId,
  email: String,
  messageId: String,
  status: String, // queued, sent, delivered, opened, clicked, bounced, unsubscribed, complained, failed
  events: [EventSchema],
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  bouncedAt: Date,
  unsubscribedAt: Date
}
```

### Unsubscribe Collection
```javascript
{
  email: String,
  userId: ObjectId,
  campaignId: ObjectId,
  reason: String,
  customReason: String,
  preferences: {
    marketing: Boolean,
    notifications: Boolean,
    newsletters: Boolean,
    updates: Boolean
  },
  unsubscribedAt: Date
}
```

## User Model Extensions

The User model has been extended with email preferences:

```javascript
{
  emailPreferences: {
    marketing: Boolean,
    notifications: Boolean,
    newsletters: Boolean,
    updates: Boolean,
    courseRecommendations: Boolean,
    achievementNotifications: Boolean
  },
  lastEmailSent: Date,
  emailFrequency: String // daily, weekly, monthly, never
}
```

## Admin Interface

Access the admin interface at: `http://localhost:5001/admin/email`

The admin interface provides:
- **Dashboard**: Overview of campaign performance and statistics
- **Campaign Management**: Create, edit, send, and monitor campaigns
- **Template Management**: Create and manage email templates
- **Analytics**: View detailed campaign analytics and reports

## Default Templates

The system includes 5 default templates:

1. **Welcome Email**: For new user onboarding
2. **Weekly Digest**: Regular platform updates
3. **Course Recommendations**: Personalized course suggestions
4. **Achievement Notification**: Celebrate user achievements
5. **Re-engagement Campaign**: Bring back inactive users

## Configuration

### Environment Variables
- `MONGO_URI`: MongoDB connection string
- `MAILGUN_API_KEY`: Mailgun API key (optional, defaults to existing key)
- `MAILGUN_WEBHOOK_SIGNING_KEY`: Webhook signature verification key

### Mailgun Configuration
- Domain: edunode.org
- API URL: https://api.eu.mailgun.net
- From email: hi@edunode.org

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Default Templates**:
   ```bash
   node scripts/initEmailMarketing.js
   ```

3. **Start the Server**:
   ```bash
   npm run dev
   ```

4. **Access Admin Interface**:
   Open `http://localhost:5001/admin/email`

## Usage Examples

### Create a Campaign
```javascript
const campaignData = {
  name: 'Welcome Series',
  subject: 'Welcome to EduNode!',
  templateId: 'template_id',
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
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
};

const response = await fetch('/api/email/campaigns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(campaignData)
});
```

### Send a Campaign
```javascript
const response = await fetch(`/api/email/campaigns/${campaignId}/send`, {
  method: 'POST'
});
```

### Get Campaign Analytics
```javascript
const response = await fetch(`/api/email/analytics/campaign/${campaignId}`);
const analytics = await response.json();
```

## Best Practices

### Deliverability
- Start with small batch sizes (50-100 emails)
- Use appropriate delays between batches (1-2 seconds)
- Monitor bounce rates and complaint rates
- Keep email frequency reasonable for users

### Content
- Use personalization variables effectively
- Test templates before sending
- Include unsubscribe links
- Follow email marketing best practices

### Segmentation
- Start with broad segments, then refine
- Test different segment combinations
- Monitor segment performance
- Update segments regularly

## Troubleshooting

### Common Issues
1. **Campaign not sending**: Check campaign status and user segments
2. **Low open rates**: Review subject lines and send times
3. **High bounce rates**: Verify email list quality
4. **Webhook issues**: Check webhook URL and signature verification

### Logs
- Check server logs for detailed error messages
- Monitor email logs for delivery issues
- Use webhook logs to track events

## Security Considerations

- All API endpoints require authentication
- Webhook signature verification enabled
- Email preferences respected for all campaigns
- Rate limiting prevents abuse
- Unsubscribe requests processed immediately

## Performance

- Batch processing prevents server overload
- Database indexes optimized for queries
- Caching implemented for frequently accessed data
- Background processing for email sending

## Future Enhancements

- A/B testing capabilities
- Advanced automation rules
- Integration with more email providers
- Machine learning for send time optimization
- Advanced personalization features
- Integration with CRM systems

## Support

For issues or questions:
1. Check the server logs
2. Review the API documentation
3. Test with small user segments first
4. Monitor campaign analytics for issues

---

This email marketing system provides a comprehensive solution for engaging your EduNode users with personalized, targeted email campaigns while maintaining compliance and deliverability best practices.
