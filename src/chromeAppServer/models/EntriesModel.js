var mongoose = require('mongoose');

var EntryModel = new mongoose.Schema({
  userID: String,
  hash: String,
  malicious: {type: Boolean, default: false},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Entry', EntryModel);