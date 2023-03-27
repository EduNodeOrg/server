const mongoose = require('mongoose');

const BalanceSchema = new mongoose.Schema({
  balance: {
    type: String,
  },
  buying_liabilities: {
    type: String,
  },
  selling_liabilities: {
    type: String,
  },
  last_modified_ledger: {
    type: String,
},
limit: {
  type: String,
},
limit: {
    type: String,
  }});

module.exports = mongoose.model('Balance', BalanceSchema);