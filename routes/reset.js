const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

router.patch("/", (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    const thisRequest = getResetRequest(req.body.id);
    if (thisRequest) {
        const user = getUser(thisRequest.email);
        bcrypt.hash(req.body.password, 10).then(hashed => {
            user.password = hashed;
            updateUser(user);
            res.status(204).json();
        })
    } else {
        res.status(404).json();
    }
});


module.exports = router;
