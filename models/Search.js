const express = require("express");
const router = express.Router();
const SearchData = require('../models/SearchData');

router.get("/search", async (req, res) => {
    const { name, website, description, country } = req.query;
    try {
        let searchData = await SearchData.find({ name: { $regex: name, $options: 'i' }, website: { $regex: website, $options: 'i' }, description: { $regex: description, $options: 'i' }, country: { $regex: country, $options: 'i' } });
        if (searchData) {
            res.json(searchData);
        } else {
            res.status(404).json({ message: "No search results found" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});