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

const femaleSchema = new mongoose.Schema({
  url: String,
  name: String,
  rating: Number,
});
const maleSchema = new mongoose.Schema({
  url: String,
  name: String,
  rating: Number,
});

const Female = mongoose.model('Female', femaleSchema); 
const Male = mongoose.model('Male', maleSchema); 
const K = 32;

const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", express.static('public/styles'));
app.use("/js", express.static('public/js'));
app.set('view engine', 'hbs');
app.set("views", __dirname + "/views");

app.get("/", async (req, res) => {
  try {
    const randomImage = await Male.aggregate([{ $sample: { size: 2 } }]);
    res.render('index', {
      titulo: 'FakeMash',
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
app.get("/get-new-images", async (req, res) => {
  try {
    const randomImage = await Female.aggregate([{ $sample: { size: 2 } }]);
    res.send([randomImage[0], randomImage[1]])
  } catch (error) {
    console.error('Error al procesar el voto:', error);
    res.status(500).send('Error interno del servidor');
  }
});
// Manejar la elección del usuario
app.post("/vote/female", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Female.findOne({ name: winner });
    const imageLoser = await Female.findOne({ name: loser });

    // Actualiza las calificaciones basadas en el resultado del voto
    if (imageWinner && imageLoser) {
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
    const randomImage = await Female.aggregate([{ $sample: { size: 1 } }]);
    res.send(randomImage[0])
  } catch (error) {
    console.error('Error al procesar el voto:', error);
    res.status(500).send('Error interno del servidor');
  }
});
app.post("/vote/male", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Male.findOne({ name: winner });
    const imageLoser = await Male.findOne({ name: loser });

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
    const randomImage = await Male.aggregate([{ $sample: { size: 1 } }]);
    res.send(randomImage[0])
  } catch (error) {
    console.error('Error al procesar el voto:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.get("/generate-images/female/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    for (let i = 0; i < count; i++) {
      const response = await axios.get('https://this-person-does-not-exist.com/new?gender=female&age=19-25&etnic=white');
      const female = await Female.findOneAndUpdate(
        { url: response.data.src },
        { $setOnInsert: { url: response.data.src, name: faker.person.fullName({ sex: 'female' }), rating: 1000 } },
        { upsert: true, new: true }
      );
      // Enviar actualización periódica al cliente
      // res.write(`Generando imagen > ${image.name}: ${image} ${i + 1} / ${count}\n`);
    }
    res.send("Generacion Finalizada")
  } catch (error) {
    console.error('Error al crear las imágenes:', error);
  }
});
app.get("/generate-images/male/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    for (let i = 0; i < count; i++) {
      const response = await axios.get('https://this-person-does-not-exist.com/new?gender=male&age=19-25&etnic=white');
      const male = await Male.findOneAndUpdate(
        { url: response.data.src },
        { $setOnInsert: { url: response.data.src, name: faker.person.fullName({ sex: 'male' }), rating: 1000 } },
        { upsert: true, new: true }
      );
    }
    res.send("Generacion Finalizada")
  } catch (error) {
    console.error('Error al crear las imágenes:', error);
  }
});

app.get("/ranking/female", async (req, res) => {
  try {
    // Obtener las 10 imágenes con el Elo más alto
    const topImages = await Female.find().sort({ rating: -1 }).limit(10);
    // const cleanedTopImages = topImages.map(image => ({
    //   ...image.toObject(),
    //   name: image.name.replace(/^avatar-gen/, '').replace(/\.jpg$/, '')
    // }));
    // Renderizar la plantilla de ranking con la lista de imágenes
    res.render('ranking', { titulo: 'Top 10 Elo Ranking Female', ranking: topImages });
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).send('Error interno del servidor');
  }
});
app.get("/ranking/male", async (req, res) => {
  try {
    // Obtener las 10 imágenes con el Elo más alto
    const topImages = await Male.find().sort({ rating: -1 }).limit(10);
    // const cleanedTopImages = topImages.map(image => ({
    //   ...image.toObject(),
    //   name: image.name.replace(/^avatar-gen/, '').replace(/\.jpg$/, '')
    // }));
    // Renderizar la plantilla de ranking con la lista de imágenes
    res.render('ranking', { titulo: 'Top 10 Elo Ranking Male', ranking: topImages });
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).send('Error interno del servidor');
  }
});

app.listen(port, () => {
  console.log(`>> Server: http://localhost:${port}`);
});