const express = require("express");
const router = express.Router();
const Meme = require("../models/meme");

const K = 32;

router.get("/", async function (req, res) {
  res.render("searchMeme", {
    titulo: "MemeMash",
  });
});

router.get("/meme", async function (req, res) {
  try {
    // const randomImage = await Meme.aggregate([{ $sample: { size: 2 } }]);
    res.render("meme", {
      titulo: "MemeMash",
      // memeGif1: randomImage[0].url,
      // meme1: randomImage[0].name,
      // memeGif2: randomImage[1].url,
      // meme: randomImage[1].name,
    });
  } catch (error) {
    console.error("Error al obtener las imágenes:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.post("/vote", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Meme.findOne({ name: winner });
    const imageLoser = await Meme.findOne({ name: loser });

    // Actualiza las calificaciones basadas en el resultado del voto
    if (imageWinner && imageLoser) {
      // Calcula las expectativas (Ea y Eb) utilizando la fórmula de Elo rating
      const Ea =
        1 / (1 + 10 ** ((imageLoser.rating - imageWinner.rating) / 400));
      const Eb =
        1 / (1 + 10 ** ((imageWinner.rating - imageLoser.rating) / 400));
      imageWinner.rating += K * (1 - Ea);
      imageLoser.rating += K * (0 - Eb);
      // Guarda las nuevas calificaciones en la base de datos
      await imageWinner.save();
      await imageLoser.save();
    }
    // Devuelve un documento de la base de datos
    const randomImage = await Meme.aggregate([{ $sample: { size: 1 } }]);
    res.send(randomImage[0]);
  } catch (error) {
    console.error("Error al procesar el voto:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.post("/generate-images", async (req, res) => {
  const search = req.body.search;
  if(!search) return;
  try {
    const count = 10;
    const response = await axios.get(
      `https://tenor.googleapis.com/v2/search?q=${search}&key=${process.env.TENOR_KEY}&client_key=my_test_app&media_filter=minimal&contentfilter=off&limit=${count}`
    );
    for (let i = 0; i < count; i++) {
      await Meme.findOneAndUpdate(
        { url: response.data.results[i].media_formats.gif.url },
        {
          $setOnInsert: {
            url: response.data.results[i].media_formats.gif.url,
            name: response.data.results[i].content_description,
            rating: 1000,
          },
        },
        { upsert: true, new: true }
      );
    }
    res.send(search);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
    // console.error("Error al crear las imágenes:", error);
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const topImages = await Meme.find().sort({ rating: -1 }).limit(10);
    res.render("ranking", {
      titulo: "Top 10 Elo Ranking Memes",
      ranking: topImages,
    });
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/get-new-images", async (req, res) => {
  try {
    const randomImage = await Meme.aggregate([{ $sample: { size: 2 } }]);
    res.send([randomImage[0], randomImage[1]]);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
});
module.exports = router;
