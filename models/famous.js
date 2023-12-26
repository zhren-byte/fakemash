const mongoose = require('mongoose');

const famousSchema = new mongoose.Schema({
    url: String,
    name: String,
    rating: Number,
    gender: String
  });
module.exports = mongoose.model('Famous', famousSchema);

