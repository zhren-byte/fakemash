const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require("dotenv");
const { faker } = require('@faker-js/faker');
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
mongoose.connect(process.env.MONGO_URI || '')
  .then(() => {
    console.error('>> Mongoose conectado');
  }, err => {
    console.error(`>> Mongoose error: \n${err.stack}`);
  });
mongoose.Promise = global.Promise;
mongoose.connection.on('disconnected', () => {
  console.warn("Mongoose connection lost");
});

const imageSchema = new mongoose.Schema({
  url: String,
  name: String,
  rating: Number,
});

const Image = mongoose.model('Image', imageSchema); 
const K = 32;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", express.static('public/styles'));
app.set('view engine', 'hbs');
app.set("views", __dirname + "/views");

app.get("/", async (req, res) => {
  try {
    const randomImage = await Image.aggregate([{ $sample: { size: 2 } }]);
    res.render('index', {
      titulo: 'Faces Mash',
      girlImg1: `https://this-person-does-not-exist.com/${randomImage[0].url}`,
      girl1: randomImage[0].name,
      girlImg2: `https://this-person-does-not-exist.com/${randomImage[1].url}`,
      girl2: randomImage[1].name,
    });
  } catch (error) {
    console.error('Error al obtener las imágenes:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Manejar la elección del usuario
app.post("/vote", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Image.findOne({ name: winner });
    const imageLoser = await Image.findOne({ name: loser });

    // Actualiza las calificaciones basadas en el resultado del voto
    if (imageWinner != undefined && imageLoser != undefined) {
      // Calcula las expectativas (Ea y Eb) utilizando la fórmula de Elo rating
      const Ea = 1 / (1 + 10 ** ((imageLoser.rating - imageWinner.rating) / 400));
      const Eb = 1 / (1 + 10 ** ((imageWinner.rating - imageLoser.rating) / 400));
      imageWinner.rating += K * (1 - Ea);
      imageLoser.rating += K * (0 - Eb);
      // Guarda las nuevas calificaciones en la base de datos
      await imageWinner.save();
      await imageLoser.save();
    }
    // Devuelve un documento de la base de datos
    const randomImage = await Image.aggregate([{ $sample: { size: 1 } }]);
    res.send(randomImage[0])
  } catch (error) {
    console.error('Error al procesar el voto:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get("/generate-images/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    for (let i = 0; i < count; i++) {
      const response = await axios.get('https://this-person-does-not-exist.com/new?gender=female&age=19-25&etnic=white');
      const image = await Image.findOneAndUpdate(
        { url: response.data.src },
        { $setOnInsert: { url: response.data.src, name: faker.person.firstName('female'), rating: 1000 } },
        { upsert: true, new: true }
      );
      // Enviar actualización periódica al cliente
      res.write(`Generando imagen > ${image.name}: ${image} ${i + 1} / ${count}\n`);
    }
    res.end()
  } catch (error) {
    console.error('Error al crear las imágenes:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get("/ranking", async (req, res) => {
  try {
    // Obtener las 10 imágenes con el Elo más alto
    const topImages = await Image.find().sort({ rating: -1 }).limit(10);
    const cleanedTopImages = topImages.map(image => ({
      ...image.toObject(),
      name: image.name.replace(/^avatar-gen/, '').replace(/\.jpg$/, '')
    }));
    // Renderizar la plantilla de ranking con la lista de imágenes
    res.render('ranking', { titulo: 'Top 10 Elo Ranking', ranking: cleanedTopImages });
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(port, () => {
  console.log(`>> Server: http://localhost:${port}`);
});