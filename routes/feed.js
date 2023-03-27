const express = require("express");
const router = express.Router();
const Feed = require('../models/Feed');

router.get("/", async (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    

})

module.exports = router;