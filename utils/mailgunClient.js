/**
 * utils/mailgunClient.js
 *
 * Centralised Mailgun client factory.
 * All route files MUST import this instead of instantiating their own client
 * with a hardcoded API key.
 *
 * The API key is read exclusively from the MAILGUN_API_KEY environment variable
 * which must be set in config/config.env (never committed to source control).
 */
const formData = require('form-data');
const Mailgun = require('mailgun.js');

if (!process.env.MAILGUN_API_KEY) {
  console.warn('[mailgunClient] WARNING: MAILGUN_API_KEY environment variable is not set. Email sending will fail.');
}

const mailgun = new Mailgun(formData);

const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY || '',
  url: process.env.MAILGUN_URL || 'https://api.eu.mailgun.net',
});

module.exports = mg;
