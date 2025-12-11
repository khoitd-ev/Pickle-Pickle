// src/config/mongo.js
import mongoose from "mongoose";
import { config } from "./env.js";

export async function connectMongo() {
  const uri = config.mongoUri;

  try {
    await mongoose.connect(uri);

    console.log("[MongoDB] Connected:", uri);

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Disconnected");
    });
  } catch (err) {
    console.error("[MongoDB] Failed to connect:", err);
    throw err; // để server.js dừng hẳn nếu DB lỗi
  }
}

export function getMongoConnection() {
  return mongoose.connection;
}
