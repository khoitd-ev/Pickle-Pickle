// src/modules/auth/auth.routes.js
import {
  registerHandler,
  verifyEmailHandler,
  resendEmailOtpHandler,
  loginHandler,
} from "./auth.controller.js";

export async function authRoutes(app , opts ) {

  app.post("/auth/register", registerHandler);
  app.post("/auth/verify-email", verifyEmailHandler);
  app.post("/auth/resend-email-otp", resendEmailOtpHandler);
  app.post("/auth/login", loginHandler);
}
