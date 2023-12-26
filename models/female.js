const mongoose = require('mongoose');

const femaleSchema = new mongoose.Schema({
    url: String,
    name: String,
    rating: Number,
  });
module.exports = mongoose.model('Female', femaleSchema);

