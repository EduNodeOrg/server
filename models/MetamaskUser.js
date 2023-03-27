const mongoose = require('mongoose');

const MetamaskUserSchema = new mongoose.Schema({
    isVerified: {
        type: Boolean,
        default: false
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
    date: {
        type: Date,
        default: Date.now
    }
    
});

const MetamaskUser = mongoose.model('MetamaskUser', MetamaskUserSchema);

module.exports = MetamaskUser;