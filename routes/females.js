const express = require("express");
const router = express.Router();
const Female = require("../models/female");
const axios = require("axios");
const { faker } = require("@faker-js/faker");

const K = 32;

router.get("/", async (req, res) => {
  try {
    const randomImage = await Female.aggregate([{ $sample: { size: 2 } }]);
    res.render("index", {
      titulo: "FakeMash",
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
    const imageWinner = await Female.findOne({ name: winner });
    const imageLoser = await Female.findOne({ name: loser });

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
    const randomImage = await Female.aggregate([{ $sample: { size: 1 } }]);
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
      const female = await Female.findOneAndUpdate(
        { url: response.data.src },
        {
          $setOnInsert: {
            url: response.data.src,
            name: faker.person.fullName({ sex: "female" }),
            rating: 1000,
          },
        },
        { upsert: true, new: true }
      );
      // Enviar actualización periódica al cliente
      // res.write(`Generando imagen > ${image.name}: ${image} ${i + 1} / ${count}\n`);
    }
    res.send("Generacion Finalizada");
  } catch (error) {
    console.error("Error al crear las imágenes:", error);
  }
});

router.get("/ranking", async (req, res) => {
  try {
    const topImages = await Female.find().sort({ rating: -1 }).limit(10);
    res.render("ranking", {
      titulo: "Top 10 Elo Ranking Female",
      ranking: topImages,
    });
  } catch (error) {
    console.error("Error al obtener el ranking:", error);
    res.status(500).send("Error interno del servidor");
  }
});
router.get("/get-new-images", async (req, res) => {
  try {
    const randomImage = await Female.aggregate([{ $sample: { size: 2 } }]);
    res.send([randomImage[0], randomImage[1]]);
  } catch (error) {
    res.status(500).send("Error interno del servidor");
  }
});
module.exports = router;
