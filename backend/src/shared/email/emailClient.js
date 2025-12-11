// src/shared/email/emailClient.js
import nodemailer from "nodemailer";
import { config } from "../../config/env.js";

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.emailHost,
      port: config.emailPort,
      secure: config.emailPort === 465, // 465: SSL, 587: STARTTLS
      auth: {
        user: config.emailUser,
        pass: config.emailPass,
      },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(to, code) {
  const transporter = getTransporter();

  const mailOptions = {
    from: `"PicklePickle" <${config.emailFrom}>`,
    to,
    subject: "Xác minh tài khoản PicklePickle",
    text: `Mã xác minh của bạn là: ${code}. Mã có hiệu lực trong 5 phút.`,
    html: `
      <p>Chào bạn,</p>
      <p>Mã xác minh tài khoản PicklePickle của bạn là:</p>
      <h2>${code}</h2>
      <p>Mã có hiệu lực trong 5 phút.</p>
      <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
