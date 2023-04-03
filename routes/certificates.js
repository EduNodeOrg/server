const express = require("express");
const router = express.Router();
const cors = require('cors');
const Certificate = require("../models/certificates");
const app = express();
app.use(cors());
router.post("/", async (req, res) => {
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