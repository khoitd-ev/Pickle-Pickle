import {
  registerUser,
  verifyEmail,
  resendEmailOtp,
  loginUser,
  loginWithGoogle,
} from "./auth.service.js";

export async function registerHandler(request, reply) {
  try {
    const result = await registerUser(request.body);
    reply.code(201).send(result);
  } catch (err) {
    reply.code(400).send({ message: err.message || "Đăng ký thất bại" });
  }
}

export async function verifyEmailHandler(request, reply) {
  try {
    const result = await verifyEmail(request.body);
    reply.code(200).send(result);
  } catch (err) {
    reply.code(400).send({ message: err.message || "Xác minh thất bại" });
  }
}

export async function resendEmailOtpHandler(request, reply) {
  try {
    const result = await resendEmailOtp(request.body);
    reply.code(200).send(result);
  } catch (err) {
    reply.code(400).send({ message: err.message || "Gửi lại OTP thất bại" });
  }
}

export async function loginHandler(request, reply) {
  try {
    const result = await loginUser(request.body);
    reply.code(200).send(result);
  } catch (err) {
    // NEW: chưa verify email -> FE sẽ redirect qua /verify
    if (err?.code === "EMAIL_NOT_VERIFIED") {
      return reply.code(403).send({
        message: err.message,
        code: err.code,
        email: err.email,
        ...(err.debugOtp ? { debugOtp: err.debugOtp } : {}),
      });
    }

    reply.code(400).send({ message: err.message || "Đăng nhập thất bại" });
  }
}


  export async function googleLoginHandler(request, reply) {
    try {
      const result = await loginWithGoogle(request.body);
      reply.code(200).send(result);
    } catch (err) {
      reply.code(400).send({ message: err.message || "Google login failed" });
    }
  }