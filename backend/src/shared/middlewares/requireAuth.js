// src/shared/middlewares/requireAuth.js
import jwt from "jsonwebtoken";
import { config } from "../../config/env.js";

export async function requireAuth(request, reply) {
  try {
    const authHeader =
      request.headers["authorization"] || request.headers["Authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      reply.code(401).send({ message: "Unauthorized" });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();

    try {
      const payload = jwt.verify(token, config.jwtSecret);

      // gắn thông tin user vào request để handler dùng
      request.user = {
        id: payload.sub,
        fullName: payload.fullName,
        emailVerified: payload.emailVerified,
      };
    } catch (err) {
      reply.code(401).send({ message: "Invalid or expired token" });
    }
  } catch (err) {
    reply.code(500).send({ message: "Auth middleware error" });
  }
}
