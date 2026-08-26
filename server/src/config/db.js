const mongoose = require("mongoose");

async function connectMongo() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is not set!");
  }

  mongoose.set("bufferCommands", false); // Don't hang requests if disconnected

  await mongoose.connect(mongoUri, {
    dbName: process.env.MONGO_DB_NAME || "wdm",
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`MongoDB connected to database "${mongoose.connection.name}"`);
}

module.exports = { connectMongo };
