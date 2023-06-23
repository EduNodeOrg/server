const express = require("express");
const router = express.Router();
const ValidCertificate = require("../models/ValidCertificate");

// GET all valid certificates
router.get("/certificates", async (req, res) => {
  try {
    const certificates = await ValidCertificate.find();
    res.json(certificates);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});
router.put('/edit-valid-certificates/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const certificate = await ValidCertificate.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );
      res.json(certificate);
    } catch (error) {
      console.error('Error updating certificate:', error);
      res.status(500).json({ error: 'Failed to update certificate' });
    }
  });
  
  // Delete a valid certificate
  router.delete('/delete-valid-certificates/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      await ValidCertificate.findByIdAndRemove(id);
      res.json({ message: 'Certificate deleted successfully' });
    } catch (error) {
      console.error('Error deleting certificate:', error);
      res.status(500).json({ error: 'Failed to delete certificate' });
    }
  });
  
  module.exports = router;

module.exports = router;