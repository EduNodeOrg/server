const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
    text: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
    
});

const Blogs = mongoose.model('Blogs', BlogSchema);

module.exports = Blogs;