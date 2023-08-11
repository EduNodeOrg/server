const express = require('express');
const router = express.Router();
const Tutor = require('../models/tutor');
const User = require('../models/User');
// Create a new tutor
router.post('/', async (req, res) => {
    try {
        const tutor = new Tutor(req.body);
        await tutor.save();
        res.status(201).send(tutor);
    } catch (error) {
        res.status(400).send(error);
    }
});
// Route to return the number of tutor requests
router.get("/count", async (req, res) => {
    try {
        const count = await Tutor.countDocuments();
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// GET all requests
router.get("/", async (req, res) => {
    try {
        const tutors = await Tutor.find();
        res.json(tutors);
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

router.put('/edit/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { email } = req.body;
    const { role } = req.body;
    try {
        const tutor = await Tutor.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );
    
        if (status === 'accepted') {
            User.findOneAndUpdate({ email }, { role }, { new: true })
                .then(user => {
                    if (!user) {
                        res.status(404).json({ message: 'User not found' });
                    } else {
                        res.json({ message: 'Tutor status and role updated successfully' });
                    }
                })
                .catch(error => {
                    console.error(error);
                    res.status(500).json({ message: 'Internal server error' });
                });
        } else {
            res.json(tutor);
        }
    } catch (error) {
        console.error('Error updating request:', error);
        res.status(500).json({ error: 'Failed to update request' });
    }
    
});

// Delete a valid certificate
router.delete('/delete/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Tutor.findByIdAndRemove(id);
        res.json({ message: 'Tutor deleted successfully' });
    } catch (error) {
        console.error('Error deleting tutor:', error);
        res.status(500).json({ error: 'Failed to delete tutor' });
    }
});

// Route to return the number of requests with an accepted status
router.get("/acceptedCount", async (req, res) => {
    try {
        const count = await Tutor.countDocuments({ status: "accepted" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Route to return the number of requests with a rejected status
router.get("/rejectedCount", async (req, res) => {
    try {
        const count = await Tutor.countDocuments({ status: "rejected" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});
module.exports = router;
