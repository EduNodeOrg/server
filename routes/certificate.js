const express = require("express");
const router = express.Router();
const Certificate = require("../models/Certificate");

router.post("/saveImage", async (req, res) => {
  try {
    const newCertificate = new Certificate({
      image: req.body.image,
    });
    const savedCertificate = await newCertificate.save();
    res.json(savedCertificate);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

module.exports = router;