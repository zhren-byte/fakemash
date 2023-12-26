const mongoose = require("mongoose");
module.exports = {
  init: () => {
    mongoose.connect(process.env.MONGO_URI || "").then(
      () => {
        console.error(">> Mongoose conectado");
      },
      (err) => {
        console.error(`>> Mongoose error: \n${err.stack}`);
      }
    );
    mongoose.Promise = global.Promise;
    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose connection lost");
    });
  },
};
