const Notification = require("../models/Notification"); 
const express = require("express");
const router = express.Router();
const app = express();


router.get("/notification/:email", async (req, res) => {
    console.log("heloooooooooooo");
    try {
      const notifications = await Notification.find({ email: req.params.email });
      const notificationData = notifications.map(notif => ({
        notificationMessage: notif.message,
        notificationDate: notif.date,
        email: notif.email,
  
      }));
      res.status(200).json(notificationData);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });
  
  router.get("/notification", async (req, res) => {

    try {
      const notifications = await Notification.find();
      const notificationData = notifications.map(notif => ({
        notificationMessage: notif.message,
        notificationDate: notif.date,
        email: notif.email,
  
      }));
      res.status(200).json(notificationData);
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  });
  
  
  module.exports = router;