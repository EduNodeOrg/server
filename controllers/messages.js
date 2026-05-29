const Message = require('../models/Messages');
const MessageNotif = require('../models/MessageNotif');
const mg = require('../utils/mailgunClient');


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
    const { senderEmail, receiverEmail, content,image  } = req.body;

    const newMessage = new Message({ senderEmail, receiverEmail, content,image  });

    const savedMessage = await newMessage.save();

    const newNotification = new MessageNotif({
      message: `You have a new Message from ${senderEmail} `,
      time: new Date(),
      receiver: receiverEmail,
      sender: senderEmail
    });
    await newNotification.save();
    console.log('Message notification saved !')
    const data = {
      from: 'hi@edunode.org',
      to: receiverEmail,
      subject: 'New Message!',
      text: `Hello! Your have a new message from ${senderEmail} on Edunode`
    };
    mg.messages.create(process.env.MAILGUN_DOMAIN || 'edunode.org', data, function (error, body) {
      if (error) {
        console.log('Error sending email:', error.message || error);
        // Don't crash the server, just log the error
      } else {
        console.log('Email sent successfully:', body);
      }
    });


    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
