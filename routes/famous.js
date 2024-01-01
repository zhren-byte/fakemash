const express = require("express");
const router = express.Router();

const gender = require("gender");

const famousData = require("../json/famous.json");
const Famous = require("../models/famous");

const K = 32;

router.get("/female", async (req, res) => {
  try {
    const randomFemale = await Famous.aggregate([
      { $match: { gender: "female" } },
      { $sample: { size: 2 } },
    ]);
    res.render("index", {
      titulo: "FakeMash",
      girlImg1: `${randomFemale[0].url}`,
      girl1: randomFemale[0].name,
      girlImg2: `${randomFemale[1].url}`,
      girl2: randomFemale[1].name,
    });
  } catch (error) {
    console.error("Error al obtener las imágenes:", error);
    res.status(500).send("Error interno del servidor");
  }
});

// router.get("/male", async (req, res) => {
//   try {
//     const randomMale = await Famous.aggregate([
//       { $match: { gender: "male" } },
//       { $sample: { size: 2 } },
//     ]);
//     res.render("index", {
//       titulo: "FakeMash",
//       girlImg1: `${randomMale[0].url}`,
//       girl1: randomMale[0].name,
//       girlImg2: `${randomMale[1].url}`,
//       girl2: randomMale[1].name,
//     });
//   } catch (error) {
//     console.error("Error al obtener las imágenes:", error);
//     res.status(500).send("Error interno del servidor");
//   }
// });

//new code
router.get("/male", async (req, res) => {
  try {
    const randomMale = await Famous.aggregate([
      { $match: { gender: "male" } },
      { $sample: { size: 2 } },
    ]);
    if (randomMale.length >= 2) {
      const imagesContext = randomMale.map((famous, index) => ({
        img: `${famous.url}`,
        name: famous.name,
        id: index + 1,
      }));
      res.render("index", { titulo: "FakeMash", images: imagesContext });
    } else {
      res
        .status(404)
        .send("No hay suficientes famosos masculinos en la base de datos.");
    }
  } catch (error) {
    console.error("Error al obtener las imágenes:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.post("/male/vote", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Famous.findOne({ name: winner });
    const imageLoser = await Famous.findOne({ name: loser });

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
    const randomImage = await Famous.aggregate([
      { $match: { gender: "male" } },
      { $sample: { size: 1 } },
    ]);
    res.send(randomImage[0]);
  } catch (error) {
    console.error("Error al procesar el voto:", error);
    res.status(500).send("Error interno del servidor");
  }
});
router.post("/female/vote", async (req, res) => {
  try {
    const { winner, loser } = req.body;

    // Recupera las imágenes desde la base de datos
    const imageWinner = await Famous.findOne({ name: winner });
    const imageLoser = await Famous.findOne({ name: loser });

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
    const randomImage = await Famous.aggregate([
      { $match: { gender: "female" } },
      { $sample: { size: 1 } },
    ]);
    res.send(randomImage[0]);
  } catch (error) {
    console.error("Error al procesar el voto:", error);
    res.status(500).send("Error interno del servidor");
  }
});

router.get("/generate-famous", async (req, res) => {
  famousData.forEach(async (famous) => {
    // Estimar el género basándose en el nombre
    const estimatedGender = gender.guess(famous.name).gender;

    // Crear un objeto con el nombre y el género
    const name = famous.name.toLowerCase().split(" ");
    const famousToInsert = {
      url: `https://www.famousbirthdays.com/faces/${name[1]}-${name[0]}-image.jpg`,
      name: famous.name,
      gender: estimatedGender,
      rating: 1000,
    };

    // Insertar en la base de datos
    try {
      await Famous.create(famousToInsert);
      console.log(
        `Famoso insertado en la base de datos: ${famousToInsert.name}`
      );
    } catch (error) {
      console.error(
        `Error al insertar famoso ${famousToInsert.name}: ${error}`
      );
    }
  });
});

router.get("/ranking", async (req, res) => {
  try {
    const topImages = await Famous.find().sort({ rating: -1 }).limit(10);
    res.render("ranking", {
      titulo: "Top 10 Elo Ranking Famous",
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
