const express = require('express');
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const port = process.env.PORT || 3000;

loginMongoose = require('../utils/mongoose');

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", express.static('public/styles'));
app.use("/js", express.static('public/js'));
app.set('view engine', 'hbs');
app.set("views", __dirname + "/views");

const memes = require("../routes/memes.js");
const females = require("../routes/females.js");
const males = require("../routes/males.js");
const famous = require("../routes/famous.js");

app.use("/memes", memes);
app.use("/female", females);
app.use("/male", males);
app.use("/famous", famous);

app.listen(port, () => {
  loginMongoose.init();
  console.log(`>> Server: http://localhost:${port}`);
});