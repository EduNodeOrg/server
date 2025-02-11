const express = require('express');
const Message = require('../models/Messages');
const router = express.Router();
const messageController = require('../controllers/messages');

// GET messages between sender and receiver
router.get('/', messageController.getMessages);

// POST a new message
router.post('/', messageController.createMessage);


router.get('/count', async (req, res) => {
  try {
    const { sender, receiver } = req.query;

    let query = {
      $or: [
        { senderEmail: receiver, receiverEmail: sender },
        { senderEmail: receiver, receiverEmail: sender },
      ],
    };

    // If the 'afterReset' query parameter is present and truthy, only consider messages sent after the reset
    if (req.query.afterReset) {
      query.createdAt = { $gt: new Date(req.query.afterReset) };
    }

    const messages = await Message.find(query);

    let count = 0;
    messages.forEach((message) => {
      count += message.messageCount;
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.get('/countAll/:sender', async (req, res) => {
  try {
    const sender = req.params.sender;

    let query = {
      receiverEmail: sender
    };
    const messages = await Message.find(query);

    let count = 0;
    messages.forEach((message) => {
      count += message.messageCount;
    });

    res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/reset', async (req, res) => {
  try {
    const { sender, receiver } = req.body;

    // Update the message count to 0 for the specified users
    await Message.updateMany(
      {
        $or: [
          { senderEmail: receiver, receiverEmail: sender },
          { senderEmail: receiver, receiverEmail: sender },
        ],
      },
      { $set: { messageCount: 0 } }
    );

    res.status(200).json({ message: 'Message count reset successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;
