const Message = require('../models/Messages');
const MessageNotif = require('../models/MessageNotif');


exports.getMessages = async (req, res) => {
  try {
    const { sender, receiver } = req.query;
    const messages = await Message.find({
      $or: [
        { senderEmail: sender, receiverEmail: receiver },
        { senderEmail: receiver, receiverEmail: sender },
      ],
    }).sort({ createdAt: 1 });

    // Format the timestamp for each message
    const formattedMessages = messages.map((message) => {
      return {
        ...message._doc,
        timestamp: message.getRelativeTime(),
      };
    });

    res.status(200).json({ messages: formattedMessages });
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

    const newNotification = new MessageNotif({
      message: `You have a new Message from ${senderEmail} `,
      time: new Date(),
      receiver: receiverEmail,
      sender: senderEmail
    });
    await newNotification.save();
    console.log('Message notification saved !')

    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
