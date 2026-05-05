const express = require("express");
const router = express.Router();
const crypto = require('crypto');
const emailService = require('../services/emailService');

// Mailgun webhook handler
router.post('/mailgun', async (req, res) => {
  try {
    // Verify webhook signature (if configured)
    const signature = req.headers.signature;
    const timestamp = req.headers.timestamp;
    const token = req.body.signature?.token;

    if (process.env.MAILGUN_WEBHOOK_SIGNING_KEY) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.MAILGUN_WEBHOOK_SIGNING_KEY)
        .update(timestamp + token)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Invalid webhook signature');
        return res.status(401).send('Invalid signature');
      }
    }

    const event = req.body['event-data'];
    if (!event) {
      return res.status(400).send('Invalid webhook data');
    }

    const eventType = event.event;
    const result = await emailService.handleWebhook(eventType, event);

    if (result.success) {
      res.status(200).send('OK');
    } else {
      console.error('Webhook processing failed:', result.error);
      res.status(500).send('Processing failed');
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Generic webhook handler for other providers
router.post('/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const event = req.body;

    let eventType;
    let processedEvent;

    switch (provider) {
      case 'sendgrid':
        eventType = Array.isArray(event) ? event[0]?.event : event.event;
        processedEvent = Array.isArray(event) ? event[0] : event;
        break;
      
      case 'mailchimp':
        eventType = event.type;
        processedEvent = event;
        break;
      
      default:
        return res.status(400).send('Unsupported provider');
    }

    const result = await emailService.handleWebhook(eventType, processedEvent);

    if (result.success) {
      res.status(200).send('OK');
    } else {
      console.error('Webhook processing failed:', result.error);
      res.status(500).send('Processing failed');
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Internal server error');
  }
});

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = router;
