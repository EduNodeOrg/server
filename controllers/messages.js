const Message = require('../models/Messages');

// Get messages between sender and receiver
// Get messages between sender and receiver
exports.getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;
    const messages = await Message.find({
      $or: [
        { senderEmail: sender, receiverEmail: receiver },
        { senderEmail: receiver, receiverEmail: sender },
      ],
    }).sort({ createdAt: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};


// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const { senderEmail, receiverEmail, content } = req.body;
    const newMessage = new Message({ senderEmail, receiverEmail, content });
    const savedMessage = await newMessage.save();
    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
