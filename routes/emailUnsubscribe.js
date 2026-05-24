const express = require("express");
const router = express.Router();
const Unsubscribe = require('../models/Unsubscribe');
const User = require('../models/User');
const emailService = require('../services/emailService');

// Handle unsubscribe requests
router.get('/', async (req, res) => {
  try {
    console.log('Unsubscribe route called at /api/email/unsubscribe');
    console.log('Query params:', req.query);
    const { email, campaign, reason = 'user_request' } = req.query;

    if (!email) {
      console.log('Email parameter missing');
      return res.status(400).send('Email parameter is required');
    }

    console.log('Processing unsubscribe for email:', email);
    // Process unsubscribe
    await emailService.unsubscribeUser(email, campaign, reason);
    console.log('Unsubscribe processed successfully');

    // Serve unsubscribe confirmation page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed - EduNode</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 30px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">EduNode</div>
          <h1>Successfully Unsubscribed</h1>
          <p>You have been successfully unsubscribed from our email marketing communications.</p>
          <p>We're sorry to see you go! You can always manage your email preferences from your profile settings if you decide to re-subscribe in the future.</p>
          <p>If you unsubscribed by accident or have any questions, please contact our support team.</p>
          <p>Thank you for being part of the EduNode community!</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('An error occurred while processing your request');
  }
});

// Handle unsubscribe via POST (for forms)
router.post('/', async (req, res) => {
  try {
    const { email, campaign, reason, customReason } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const unsubscribeReason = reason === 'other' ? customReason : reason;
    await emailService.unsubscribeUser(email, campaign, unsubscribeReason);

    res.json({ success: true, message: 'Successfully unsubscribed' });

  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// Get unsubscribe status
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const unsubscribe = await Unsubscribe.findOne({ email: email.toLowerCase() });
    
    res.json({ 
      unsubscribed: !!unsubscribe,
      unsubscribeData: unsubscribe
    });
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    res.status(500).json({ error: 'Failed to check unsubscribe status' });
  }
});

// Get unsubscribe preferences form
router.get('/preferences', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send('Email parameter is required');
  }

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Email Preferences - EduNode</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
        }
        .container {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 30px;
          background-color: #f9f9f9;
        }
        h1 {
          color: #333;
          margin-bottom: 20px;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input[type="checkbox"] {
          margin-right: 10px;
        }
        button {
          background-color: #007bff;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 10px;
        }
        button:hover {
          background-color: #0056b3;
        }
        .btn-danger {
          background-color: #dc3545;
        }
        .btn-danger:hover {
          background-color: #c82333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Preferences</h1>
        <form id="preferencesForm">
          <div class="form-group">
            <label>
              <input type="checkbox" name="marketing" checked> Marketing emails and promotions
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="notifications" checked> Important notifications
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="newsletters" checked> Weekly newsletters
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="updates" checked> Product updates and announcements
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="courseRecommendations" checked> Course recommendations
            </label>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" name="achievementNotifications" checked> Achievement notifications
            </label>
          </div>
          <button type="submit">Update Preferences</button>
          <button type="button" class="btn-danger" onclick="unsubscribeAll()">Unsubscribe from All</button>
        </form>
      </div>

      <script>
        document.getElementById('preferencesForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const preferences = {
            marketing: e.target.marketing.checked,
            notifications: e.target.notifications.checked,
            newsletters: e.target.newsletters.checked,
            updates: e.target.updates.checked,
            courseRecommendations: e.target.courseRecommendations.checked,
            achievementNotifications: e.target.achievementNotifications.checked
          };

          try {
            const response = await fetch('/api/email/preferences', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: '${email}',
                preferences
              })
            });

            if (response.ok) {
              alert('Preferences updated successfully!');
            } else {
              alert('Failed to update preferences');
            }
          } catch (error) {
            alert('An error occurred while updating preferences');
          }
        });

        async function unsubscribeAll() {
          if (confirm('Are you sure you want to unsubscribe from all emails?')) {
            window.location.href = '/api/email/unsubscribe?email=${encodeURIComponent('${email}')}';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Update email preferences
router.post('/preferences', async (req, res) => {
  try {
    const { email, preferences } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Update user preferences
    const user = await User.findOneAndUpdate(
      { email },
      { 
        $set: Object.keys(preferences).reduce((acc, key) => {
          acc[`emailPreferences.${key}`] = preferences[key];
          return acc;
        }, {})
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'Preferences updated successfully' });

  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

module.exports = router;
