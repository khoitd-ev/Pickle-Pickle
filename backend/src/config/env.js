// src/config/env.js
export const config = {
  // Server
  port: Number(process.env.PORT) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database
  mongoUri: process.env.MONGO_URI || "mongodb://mongo:27017/picklepickle_dev",
  redisUrl: process.env.REDIS_URL || "redis://redis:6379",

  // Auth
  jwtSecret: process.env.JWT_SECRET || "dev_super_secret_change_me",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",

  // API
  apiPrefix: process.env.API_PREFIX || "/api",

  // Email
  emailHost: process.env.EMAIL_HOST,
  emailPort: Number(process.env.EMAIL_PORT || 587),
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: process.env.EMAIL_FROM || process.env.EMAIL_USER,

  // Payment config
  payment: {
    momo: {
      partnerCode: process.env.MOMO_PARTNER_CODE || "MOMO",
      accessKey: process.env.MOMO_ACCESS_KEY || "F8BBA842ECF85",
      secretKey: process.env.MOMO_SECRET_KEY || "K951B6PE1waDMi640xX08PD3vg6EkVlz",
      endpoint:
        process.env.MOMO_ENDPOINT ||
        "https://test-payment.momo.vn/v2/gateway/api/create",
      redirectUrl:
        process.env.MOMO_REDIRECT_URL ||
        "http://localhost:3000/payment/momo-return",
      ipnUrl:
        process.env.MOMO_IPN_URL ||
        "http://localhost:4000/api/payments/momo/ipn",
    },

 
    vnpay: {
      
      tmnCode: process.env.VNPAY_TMN_CODE || "",
      hashSecret: process.env.VNPAY_HASH_SECRET || "",

      paymentUrl:
        process.env.VNPAY_PAYMENT_URL ||
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",

      // URL redirect về FE sau khi thanh toán xong
      returnUrl:
        process.env.VNPAY_RETURN_URL ||
        "http://localhost:3000/payment/vnpay-return",

      // URL IPN về BE (để sau này update trạng thái đơn)
      ipnUrl:
        process.env.VNPAY_IPN_URL ||
        "http://localhost:4000/api/payments/vnpay/ipn",

      locale: process.env.VNPAY_LOCALE || "vn",
      version: process.env.VNPAY_VERSION || "2.1.0",
      command: process.env.VNPAY_COMMAND || "pay",
      currency: process.env.VNPAY_CURRENCY || "VND",
    },



    zalopay: {
      appId: Number(process.env.ZALOPAY_APP_ID) || 553,
      key1: process.env.ZALOPAY_KEY1 || "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q",
      key2: process.env.ZALOPAY_KEY2 || "Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3",
      endpoint:
        process.env.ZALOPAY_ENDPOINT ||
        "https://sb-openapi.zalopay.vn/v2/create",
      redirectUrl:
        process.env.ZALOPAY_REDIRECT_URL ||
        "http://localhost:3000/payment/zalopay-return",
      description: "Thanh toán đơn hàng PicklePickle",
    },
  },
};
