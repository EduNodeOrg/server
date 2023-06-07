const express = require("express");
const router = express.Router();
const User = require('../models/User');
const crypto = require('crypto');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });







// Function to send reset password email
function sendResetPasswordEmail(email, resetToken) {
    const resetURL = `https://edunode.org/reset-password?token=${resetToken}`;

    const data = {
        from: 'hi@edunode.org',
        to: email,
        subject: 'Reset Password',
        html: `
      <p>Please click the following link to reset your password:</p>
      <a href="http://localhost:3000/reset-password?token=${resetToken}">Reset Password</a>
    `,
    };

    mg.messages.create(domain, data, function (error, body) {
        if (error) {
            console.log('Error sending email:', error);
            res.status(500).json({ error: 'Error sending email' });
        } else {
            console.log('Email sent successfully:', body);
            res.json({ msg: 'Email sent' });
        }
    });
}

router.post('/reset-password', async (req, res) => {
    const email = req.body.email;

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    try {
        // Update user document in the MongoDB collection with the reset token
        let user = await User.findOneAndUpdate({ email }, { resetToken }, { new: true });
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Store the reset token in the user's document in the MongoDB collection
        user.resetToken = resetToken;
        user.resetTokenExpiration = Date.now() + 3600000; // Token expiration time (1 hour)
        await user.save();

        // Send reset password email
        sendResetPasswordEmail(user.email, resetToken);

        res.json({ msg: 'Reset password email sent' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ msg: 'Internal server error' });
    }
});


router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    // Find the user with the given reset token
    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ message: 'Invalid or expired reset token.' });
    }

    // Update the user's password
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully.' });
});


router.post('/validate-reset-token', (req, res) => {
    const { token } = req.body;

    // Validate the reset token
    // Compare the token against the stored token in the database

    // Example implementation assuming you have a User model
    User.findOne({ resetToken: token }, (err, user) => {
        if (err) {
            // Handle the error case
            console.error('Error finding user:', err);
            res.status(500).json({ tokenValid: false });
            return;
        }

        if (user && !isTokenExpired(user.resetTokenExpiration)) {
            // Token is valid
            res.json({ tokenValid: true });
        } else {
            // Token is invalid or expired
            res.json({ tokenValid: false });
        }
    });
});


// Function to check if the token is expired
function isTokenExpired(expiration) {
  // Compare the token expiration with the current time
  return expiration < Date.now();
}

module.exports = router;