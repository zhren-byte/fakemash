const mongoose = require('mongoose');

const maleSchema = new mongoose.Schema({
    url: String,
    name: String,
    rating: Number,
  });

module.exports = mongoose.model('Male', maleSchema);