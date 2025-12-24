// backend/src/modules/chatbot/chatbot.controller.js
import { handleChatbotMessage } from "./chatbot.service.js";

export async function chatbotMessageHandler(request, reply) {
  try {
    const { message, context } = request.body || {};
    if (!message || typeof message !== "string") {
      return reply.code(400).send({ message: "message is required" });
    }

    const result = await handleChatbotMessage({
      message,
      context: context && typeof context === "object" ? context : {},
    });

    return reply.send(result);
  } catch (err) {
    request.log.error(err, "chatbotMessageHandler error");
    return reply.code(500).send({ message: "Internal server error" });
  }
}
