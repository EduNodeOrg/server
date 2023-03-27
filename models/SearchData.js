const mongoose = require('mongoose');

const SearchDataSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false
    },
    website: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    },
    country: {
        type: String,
        required: false
    },
    logourl: {
        type: String,
        required: false
    }
});

const SearchData = mongoose.model('SearchData', SearchDataSchema);

module.exports = SearchData;