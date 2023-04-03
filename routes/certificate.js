const express = require("express");
const router = express.Router();
const cors = require('cors');
const Certificate = require("../models/Certificate");
const app = express();
app.use(cors());
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