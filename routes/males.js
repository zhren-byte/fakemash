const express = require("express");
const router = express.Router();
const Male = require("../models/male");
const axios = require("axios");
const { faker } = require("@faker-js/faker");

const K = 32;

router.get("/", async function (req, res) {
  try {
    const randomImage = await Male.aggregate([{ $sample: { size: 2 } }]);
    res.render("index", {
      titulo: "MemeMash",
      girlImg1: `${process.env.FAKE_API}${randomImage[0].url}`,
      girl1: randomImage[0].name,
      girlImg2: `${process.env.FAKE_API}${randomImage[1].url}`,
      girl2: randomImage[1].name,
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
    const imageWinner = await Male.findOne({ name: winner });
    const imageLoser = await Male.findOne({ name: loser });

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
    const randomImage = await Male.aggregate([{ $sample: { size: 1 } }]);
    res.send(randomImage[0]);
  } catch (error) {
    console.error("Error al procesar el voto:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/generate-images/:count", async (req, res) => {
  try {
    const count = parseInt(req.params.count);
    for (let i = 0; i < count; i++) {
      const response = await axios.get(
        `${process.env.FAKE_API}new?gender=female&age=19-25&etnic=white`
      );
      const male = await Male.findOneAndUpdate(
        { url: response.data.src },
        {
          $setOnInsert: {
            url: response.data.src,
            name: faker.person.fullName({ sex: "male" }),
            rating: 1000,
          },
        },
        { upsert: true, new: true }
      );
    }
    res.send("Generacion Finalizada");
  } catch (error) {
    console.error("Error al crear las imágenes:", error);
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const topImages = await Male.find().sort({ rating: -1 }).limit(10);
    res.render("ranking", {
      titulo: "Top 10 Elo Ranking Male",
      ranking: topImages,
    });
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/get-new-images", async (req, res) => {
  try {
    const randomImage = await Male.aggregate([{ $sample: { size: 2 } }]);
    res.send([randomImage[0], randomImage[1]]);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
});
module.exports = router;
