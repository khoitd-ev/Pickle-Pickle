import {
  createCheckoutHandler,
  momoIpnHandler,
  vnpayIpnHandler,
  confirmPaymentFromReturnHandler,
} from "./payment.controller.js";

async function paymentRoutes(app, opts) {
  // POST /api/payments/checkout
  app.post("/payments/checkout", createCheckoutHandler);

  // Confirm từ trang return (MOMO/VNPAY/ZALOPAY dùng chung)
  app.post("/payments/confirm-return", confirmPaymentFromReturnHandler);

  // MoMo IPN (POST)
  app.post("/payments/momo/ipn", momoIpnHandler);

  // VNPay IPN (GET)
  app.get("/payments/vnpay/ipn", vnpayIpnHandler);
}

export default paymentRoutes;
