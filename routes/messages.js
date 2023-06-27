const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messages');

// GET messages between sender and receiver
router.get('/', messageController.getMessages);

// POST a new message
router.post('/', messageController.createMessage);

module.exports = router;
