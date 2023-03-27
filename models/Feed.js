const mongoose = require('mongoose');

const FeedSchema = new mongoose.Schema({
   
    postText: {
        type: String,
        required: false
    },
    postId: {
        type: String,
        required: false
    },
    postedOn: {
        type: Date,
        default: Date.now
    }
    
});

const Feed = mongoose.model('Feed', FeedSchema);

module.exports = Feed;