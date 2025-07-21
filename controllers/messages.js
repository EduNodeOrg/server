const Message = require('../models/Messages');
const MessageNotif = require('../models/MessageNotif');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const domain = "edunode.org"
const mg = mailgun.client({ username: 'api', key: "key-c8d12b7428fbe666e074108aaa0820bc" || 'key-yourkeyhere', url: 'https://api.eu.mailgun.net' });


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
    mg.messages.create(domain, data, function (error, body) {
      if (error) {
        console.log('Error sending email:', error);
        res.status(500).json({ error: 'Error sending email' });
      } else {
        console.log('Email sent successfully:', body);
        res.json({ msg: 'Email sent' });
      }
    });


    res.status(201).json({ message: savedMessage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
