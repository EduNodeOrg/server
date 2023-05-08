const mongoose = require('mongoose');

const PreferencesSchema = new mongoose.Schema({

  tags: {
    type: [String],
    required: true,
  },
  
  
  email: {
    type: String,
    required: false,
  },
 
},

);

const Preferences = mongoose.model("Preferences", PreferencesSchema);


module.exports = Preferences;
