var mongoose = require('mongoose');

var EntryModel = new mongoose.Schema({
  userID: String,
  urlHash: String,
  domHash : String,
  malicious: { type: Number, min: 0, default : 0},
  suspicious : { type: Number, min: 0, default : 0},
  not_detected : { type: Number, min: 0, default : 0},
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Entry', EntryModel);