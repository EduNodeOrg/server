const mongoose = require('mongoose');

const AlbedoSchema = new mongoose.Schema({
    granted: {
        type: Boolean,
        default: false
    },
    intent: {
        type: String,
        required: false
    },
    session: {
        type: String,
        required: false
    },
    pubkey: {
        type: String,
        required: false
    },
    
    network: {
        type: String,
        required: false
    },
    userName: {
        type: String,
        required: false
    },
    signature: {
        type: String,
        required: false
    },
    signed_message: {
        type: String,
        required: false
    },
    valid_until: {
        type: Number,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }
    
});

const AlbedoUser = mongoose.model('AlbedoUser', AlbedoSchema);

module.exports = AlbedoUser;