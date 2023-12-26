const mongoose = require('mongoose');

const memeSchema = new mongoose.Schema({
    url: String,
    name: String,
    rating: Number,
  });

module.exports = mongoose.model('Meme', memeSchema);
