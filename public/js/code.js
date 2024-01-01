const cleanedTopImages = topImages.map(image => ({
    ...image.toObject(),
    name: image.name.replace(/^avatar-gen/, '').replace(/\.jpg$/, '')
}));

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const repeatedGreetings = async (res, search) => {
  for (let i = 0; i < 3; i++) await sleep(1000);
  const random = (Math.floor(Math.random() * 3))
  console.log(random)
  if(random === 2) return res.status(500).send("Error interno del servidor");
  return res.send(`Generacion finalizada para ${search}`);
};
await repeatedGreetings(res, search);
