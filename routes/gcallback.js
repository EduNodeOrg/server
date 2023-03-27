const express = require('express');
const router = express.Router();
const passport = require("passport");

router.get("/", (req, res) => {
    // res.redirect("http://localhost:5000/api/gcallback")
    res.send(req.user)
})

module.exports = router;