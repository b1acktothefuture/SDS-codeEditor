var mongoose = require('mongoose');

var sessionSchema = new mongoose.Schema({
    sourceCode: { type: String, default: "" },
    owner: String
});

module.exports = mongoose.model('Session', sessionSchema);