const express = require('express');

const router = express.Router();
const messageController = require('../controllers/messages');

// GET messages between sender and receiver
router.get('/', messageController.getMessages);

// POST a new message
router.post('/', messageController.createMessage);


router.get('/count', async (req, res) => {
    try {
      const { sender, receiver } = req.query;
  
      const count = await Message.countDocuments({
        $or: [
          { senderEmail: sender, receiverEmail: receiver },
          { senderEmail: receiver, receiverEmail: sender },
        ],
      });
  
      // Update the message count for both sender and receiver
      await Message.updateMany(
        {
          $or: [
            { senderEmail: sender, receiverEmail: receiver },
            { senderEmail: receiver, receiverEmail: sender },
          ],
        },
        { $set: { messageCount: count } }
      );
  
      res.status(200).json({ count });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
module.exports = router;
