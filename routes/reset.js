const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.patch("/", async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    try {
        const user = await User.findById(req.body.id);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        user.password = hashedPassword;
        await user.save();
        
        res.status(204).json();
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
