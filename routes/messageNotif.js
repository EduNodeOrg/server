const express = require('express');
const MessageNotif = require('../models/MessageNotif');
const router = express.Router();



router.post('/', async (req, res) => {
    try {
        const { receiver,sender } = req.body;
    const newNotification = new MessageNotif({
        message:  `You have a new Message from ${sender} `,
        time: new Date(),
        receiver: receiver,
        sender : sender
      });
      await newNotification.save();
      console.log('Message notification saved !')
      res.status(200).json({ message: 'Message notification saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
     
});

router.get("/:receiver", async (req, res) => {
    try {
      const receiver = req.params.receiver;
      const notifications = await messageNotifications.find({ receiver });
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });








module.exports = router;
