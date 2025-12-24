// backend/src/modules/chatbot/chatbot.routes.js
import { chatbotMessageHandler } from "./chatbot.controller.js";

export async function chatbotRoutes(app) {
  // POST /api/chatbot/message
  app.post("/chatbot/message", chatbotMessageHandler);
}
