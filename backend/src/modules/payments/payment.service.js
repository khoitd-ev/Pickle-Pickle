// src/modules/payments/payment.service.js
import crypto from "crypto";
import qs from "qs";
import { config } from "../../config/env.js";
import { Booking } from "../../models/booking.model.js";
import { BookingStatus } from "../../models/bookingStatus.model.js";
import { Payment } from "../../models/payment.model.js";
import { PaymentStatus } from "../../models/paymentStatus.model.js";
import { createNotification } from "../notifications/notification.service.js";
import { Venue } from "../../models/venue.model.js";

function normalizePaymentMethod(method) {
  if (!method) return null;
  const m = String(method).toUpperCase();
  if (m === "MOMO" || m === "MOMO_WALLET") return "MOMO";
  if (m === "VNPAY" || m === "VN_PAY") return "VNPAY";
  if (m === "ZALOPAY" || m === "ZALO_PAY") return "ZALOPAY";
  return null;
}

async function getPaymentStatusId(code) {
  const status = await PaymentStatus.findOne({ code });
  if (!status) {
    throw Object.assign(new Error(`PaymentStatus ${code} not found`), {
      statusCode: 500,
    });
  }
  return status._id;
}

async function getBookingStatusId(code) {
  const status = await BookingStatus.findOne({ code });
  if (!status) {
    throw Object.assign(new Error(`BookingStatus ${code} not found`), {
      statusCode: 500,
    });
  }
  return status._id;
}

/**
 * Tạo checkout cho 1 booking.
 * body: { paymentMethod, bookingId, clientIp }
 */
export async function createCheckout({ paymentMethod, bookingId, clientIp }) {
  const normalizedMethod = normalizePaymentMethod(paymentMethod);

  if (!normalizedMethod) {
    throw Object.assign(new Error("Unsupported payment method"), {
      statusCode: 400,
    });
  }

  if (!bookingId) {
    throw Object.assign(
      new Error("bookingId is required for payment checkout"),
      { statusCode: 400 }
    );
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw Object.assign(new Error("Booking not found"), {
      statusCode: 404,
    });
  }

  // check hết hạn
  const now = new Date();
  if (booking.paymentExpiresAt && booking.paymentExpiresAt <= now) {
    const cancelledId = await getBookingStatusId("CANCELLED");
    booking.status = cancelledId;
    await booking.save();
    throw Object.assign(new Error("Booking has expired"), {
      statusCode: 400,
    });
  }

  const amount = Number(booking.totalAmount || 0);
  if (!amount || amount <= 0) {
    throw Object.assign(
      new Error("Booking amount must be greater than 0"),
      { statusCode: 400 }
    );
  }

  switch (normalizedMethod) {
    case "MOMO":
      return await createMomoCheckout(booking, amount);
    case "VNPAY":
      return await createVnpayCheckout(booking, amount, clientIp);
    case "ZALOPAY":
      return await createZalopayCheckout(booking, amount);
    default:
      throw Object.assign(new Error("Unsupported payment method"), {
        statusCode: 400,
      });
  }
}

/**
 * ===== MOMO CHECKOUT =====
 */
async function createMomoCheckout(booking, amount) {
  const momoConfig = config.payment?.momo || {};

  const partnerCode = momoConfig.partnerCode;
  const accessKey = momoConfig.accessKey;
  const secretKey = momoConfig.secretKey;
  const endpoint = momoConfig.endpoint;
  const redirectUrl = momoConfig.redirectUrl;
  const ipnUrl = momoConfig.ipnUrl;

  if (!partnerCode || !accessKey || !secretKey || !endpoint) {
    throw Object.assign(
      new Error("MoMo config is missing. Please check env variables."),
      { statusCode: 500 }
    );
  }

  const amountStr = String(amount);
  const requestId = `${partnerCode}-${Date.now()}`;
  const orderId = `${booking.code || booking._id}-${Date.now()}`;
  const orderInfo = `Thanh toán booking ${booking.code || booking._id}`;
  const requestType = "captureWallet";
  const extraData = "";

  const rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amountStr +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = {
    partnerCode,
    accessKey,
    requestId,
    amount: amountStr,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "vi",
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const text = await res.text();
    const err = new Error("MoMo create payment request failed: " + text);
    err.statusCode = 502;
    throw err;
  }

  const resJson = await res.json();

  const resultCode = resJson.resultCode;
  if (resultCode !== 0 && resultCode !== "0") {
    const err = new Error(
      `MoMo create payment error: ${resJson.message || "Unknown error"}`
    );
    err.statusCode = 502;
    throw err;
  }

  const payUrl =
    resJson.payUrl || resJson.deeplink || resJson.shortLink || null;
  if (!payUrl) {
    const err = new Error("MoMo response does not contain payUrl");
    err.statusCode = 502;
    throw err;
  }

  const pendingStatusId = await getPaymentStatusId("PENDING");

  const paymentDoc = await Payment.create({
    booking: booking._id,
    provider: "MOMO",
    providerPaymentId: resJson.requestId || resJson.transId || null,
    orderId,
    amount,
    currency: "VND",
    status: pendingStatusId,
  });

  return {
    paymentId: paymentDoc._id,
    provider: "MOMO",
    paymentMethod: "MOMO",
    totalAmount: amount,
    redirectUrl: payUrl,
    bookingId: booking._id,
    bookingCode: booking.code,
  };
}

/**
 * ===== VNPay helpers =====
 */

function sortObject(obj) {
  let sorted = {};
  let arr = [];

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      arr.push(encodeURIComponent(key));
    }
  }

  arr.sort();

  for (let i = 0; i < arr.length; i++) {
    const key = arr[i];
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }

  return sorted;
}

/**
 * Tạo URL thanh toán VNPay (sandbox).
 */
async function createVnpayCheckout(booking, amount, clientIp) {
  const vnpConfig = config.payment?.vnpay || {};
  const tmnCode = vnpConfig.tmnCode;
  const secretKey = vnpConfig.hashSecret;
  const vnpUrl = vnpConfig.paymentUrl || vnpConfig.endpoint;
  const returnUrl = vnpConfig.returnUrl;

  if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
    throw Object.assign(
      new Error("VNPay config is missing. Please check env variables."),
      { statusCode: 500 }
    );
  }

  const amountNumber = Number(amount);
  if (!amountNumber || amountNumber <= 0) {
    throw Object.assign(
      new Error("Booking amount must be greater than 0"),
      { statusCode: 400 }
    );
  }

  const date = new Date();
  const pad = (n) => (n < 10 ? "0" + n : "" + n);
  const yyyy = date.getFullYear();
  const MM = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  const createDate = `${yyyy}${MM}${dd}${hh}${mm}${ss}`;

  const orderId = `${booking.code || booking._id}-${Date.now()}`; // vnp_TxnRef
  const orderInfo = `Thanh toán booking ${booking.code || booking._id}`;
  const ipAddr = clientIp || "127.0.0.1";
  const locale = vnpConfig.locale || "vn";
  const currCode = vnpConfig.currency || "VND";

  let vnp_Params = {
    vnp_Version: vnpConfig.version || "2.1.0",
    vnp_Command: vnpConfig.command || "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: amountNumber * 100,
    vnp_CurrCode: currCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: locale,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
  };

  vnp_Params = sortObject(vnp_Params);
  const signData = qs.stringify(vnp_Params, { encode: false });
  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(signData, "utf-8"))
    .digest("hex");
  vnp_Params["vnp_SecureHash"] = signed;

  const paymentUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });

  console.log("========== VNPay vnp_Params (sorted+encoded) ==========");
  console.log(vnp_Params);
  console.log("========== SIGN DATA ==========");
  console.log(signData);
  console.log("========== SECURE HASH ==========");
  console.log(signed);
  console.log("========== PAYMENT URL ==========");
  console.log(paymentUrl);

  const pendingStatusId = await getPaymentStatusId("PENDING");

  const paymentDoc = await Payment.create({
    booking: booking._id,
    provider: "VNPAY",
    providerPaymentId: orderId,
    orderId,
    amount: amountNumber,
    currency: "VND",
    status: pendingStatusId,
  });

  return {
    paymentId: paymentDoc._id,
    provider: "VNPAY",
    paymentMethod: "VNPAY",
    totalAmount: amountNumber,
    redirectUrl: paymentUrl,
    bookingId: booking._id,
    bookingCode: booking.code,
  };
}

/**
 * ===== ZaloPay checkout =====
 */
async function createZalopayCheckout(booking, amount) {
  const zaloConfig = config.payment?.zalopay || {};
  const appId = Number(zaloConfig.appId);
  const key1 = zaloConfig.key1;
  const endpoint = zaloConfig.endpoint;
  const redirectUrl = zaloConfig.redirectUrl;
  const callbackUrl = zaloConfig.callbackUrl;

  if (!appId || !key1 || !endpoint) {
    throw Object.assign(
      new Error("ZaloPay config is missing. Please check env variables."),
      { statusCode: 500 }
    );
  }

  const amountNumber = Number(amount);
  if (!amountNumber || amountNumber <= 0) {
    throw Object.assign(
      new Error("Booking amount must be greater than 0"),
      { statusCode: 400 }
    );
  }

  const appUser = "demo";
  const appTime = Date.now();

  const now = new Date();
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
  const uniqueSuffix = Math.floor(Math.random() * 1e6)
    .toString()
    .padStart(6, "0");
  const appTransId = `${yymmdd}_${uniqueSuffix}`;

  const description = `Thanh toán booking ${booking.code || booking._id}`;

  const item = JSON.stringify([
    {
      itemid: "court",
      itemname: booking.courtName || "Pickleball court",
      itemprice: amountNumber,
      itemquantity: 1,
    },
  ]);

  const embedData = JSON.stringify({
    redirecturl: redirectUrl,
    preferred_payment_method: ["zalopay_wallet"],
  });

  const dataMac = [
    appId,
    appTransId,
    appUser,
    amountNumber,
    appTime,
    embedData,
    item,
  ].join("|");

  const mac = crypto
    .createHmac("sha256", key1)
    .update(dataMac, "utf-8")
    .digest("hex");

  const body = {
    app_id: appId,
    app_user: appUser,
    app_trans_id: appTransId,
    app_time: appTime,
    amount: amountNumber,
    description,
    item,
    embed_data: embedData,
    bank_code: "",
    // callback_url: callbackUrl, // để sau nếu dùng IPN
    mac,
  };

  console.log("===== ZaloPay request body =====");
  console.log(body);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: qs.stringify(body),
  });

  const text = await res.text();
  let resJson;
  try {
    resJson = JSON.parse(text);
  } catch (e) {
    const err = new Error("ZaloPay create order parse error: " + text);
    err.statusCode = 502;
    throw err;
  }

  console.log("===== ZaloPay response =====");
  console.log(resJson);

  const returnCode = resJson.return_code ?? resJson.returncode;
  const returnMessage = resJson.return_message ?? resJson.returnmessage;

  if (returnCode !== 1) {
    const err = new Error(
      "ZaloPay create order error: " + (returnMessage || "Unknown error")
    );
    err.statusCode = 502;
    throw err;
  }

  const orderUrl = resJson.order_url || resJson.orderurl;
  const zpTransToken = resJson.zp_trans_token || resJson.zptranstoken;

  if (!orderUrl) {
    const err = new Error("ZaloPay response does not contain order_url");
    err.statusCode = 502;
    throw err;
  }

  const pendingStatusId = await getPaymentStatusId("PENDING");

  const paymentDoc = await Payment.create({
    booking: booking._id,
    provider: "ZALOPAY",
    providerPaymentId: zpTransToken || appTransId,
    orderId: appTransId,
    amount: amountNumber,
    currency: "VND",
    status: pendingStatusId,
  });

  return {
    paymentId: paymentDoc._id,
    provider: "ZALOPAY",
    paymentMethod: "ZALOPAY",
    totalAmount: amountNumber,
    redirectUrl: orderUrl,
    bookingId: booking._id,
    bookingCode: booking.code,
  };
}

/**
 * ===== MoMo IPN =====
 */
export async function handleMomoIpn(body) {
  const { orderId, resultCode, message } = body || {};

  if (!orderId) {
    throw new Error("Missing orderId in MoMo IPN");
  }

  const payment = await Payment.findOne({ orderId }).populate("booking");
  if (!payment) {
    throw new Error("Payment not found for this orderId");
  }

  const success = resultCode === 0 || resultCode === "0";
  const statusCode = success ? "SUCCEEDED" : "FAILED";
  const statusId = await getPaymentStatusId(statusCode);

  payment.status = statusId;
  await payment.save();

  if (payment.booking && success) {
    // Chỉ đổi booking khi thanh toán thành công
    const confirmedId = await getBookingStatusId("CONFIRMED");
    payment.booking.status = confirmedId;
    await payment.booking.save();
  }

  console.log(
    `[MoMo IPN] orderId=${orderId} resultCode=${resultCode} message=${message}`
  );
}

/**
 * ===== VNPay IPN =====
 */
export async function handleVnpayIpn(query) {
  let vnp_Params = { ...(query || {}) };
  const vnpConfig = config.payment?.vnpay || {};
  const secretKey = vnpConfig.hashSecret;

  if (!secretKey) {
    throw new Error("VNPay hash secret is missing");
  }

  const secureHash = vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const signData = Object.keys(vnp_Params)
    .map((k) => `${k}=${vnp_Params[k]}`)
    .join("&");

  const signed = crypto
    .createHmac("sha512", secretKey)
    .update(signData, "utf-8")
    .digest("hex");

  if (secureHash !== signed) {
    return { RspCode: "97", Message: "Fail checksum" };
  }

  const orderId = vnp_Params["vnp_TxnRef"];
  const rspCode = vnp_Params["vnp_ResponseCode"];

  if (!orderId) {
    throw new Error("Missing vnp_TxnRef in VNPay IPN");
  }

  const payment = await Payment.findOne({ orderId }).populate("booking");
  if (!payment) {
    throw new Error("Payment not found for this orderId");
  }

  const success = rspCode === "00";
  const statusCode = success ? "SUCCEEDED" : "FAILED";
  const statusId = await getPaymentStatusId(statusCode);

  payment.status = statusId;
  await payment.save();

  if (payment.booking && success) {
    const confirmedId = await getBookingStatusId("CONFIRMED");
    payment.booking.status = confirmedId;
    await payment.booking.save();
  }

  console.log(`[VNPay IPN] orderId=${orderId} rspCode=${rspCode}`);

  return { RspCode: "00", Message: "success" };
}

/**
 * ===== Confirm từ trang return (không dùng IPN) =====
 * provider: "MOMO" | "VNPAY" | "ZALOPAY"
 * orderId: MoMo/VNPay: orderId / vnp_TxnRef, ZaloPay: appTransId
 * success: boolean
 */
export async function confirmPaymentFromReturn({ provider, orderId, success }) {
  if (!provider || !orderId) {
    throw Object.assign(
      new Error("provider and orderId are required"),
      { statusCode: 400 }
    );
  }

  const normalized = normalizePaymentMethod(provider);
  if (!normalized) {
    throw Object.assign(new Error("Unsupported payment provider"), {
      statusCode: 400,
    });
  }

  const payment = await Payment.findOne({
    provider: normalized,
    orderId,
  }).populate("booking");

  if (!payment) {
    throw Object.assign(
      new Error("Payment not found for this provider/orderId"),
      { statusCode: 404 }
    );
  }

  const statusCode = success ? "SUCCEEDED" : "FAILED";
  const paymentStatusId = await getPaymentStatusId(statusCode);

  payment.status = paymentStatusId;
  await payment.save();

  if (payment.booking && success) {
    const confirmedId = await getBookingStatusId("CONFIRMED");
    payment.booking.status = confirmedId;
    await payment.booking.save();

    // load venue để lấy tên + owner
    const venue = await Venue.findById(payment.booking.venue)
      .select("_id name manager")
      .lean();

    // 1) NOTI cho CUSTOMER: đặt sân thành công
    if (!payment.booking.isGuestBooking) {
      await createNotification({
        userId: payment.booking.user,
        type: "BOOKING_CONFIRMED",
        level: "INFO",
        title: "Đặt sân thành công",
        content: `Bạn đã thanh toán thành công đơn ${payment.booking.code}${venue?.name ? ` tại "${venue.name}"` : ""
          }.`,
        data: {
          bookingId: String(payment.booking._id),
          bookingCode: payment.booking.code,
          venueId: venue?._id ? String(venue._id) : null,
          route: "/history",
        },
        dedupeKey: `BOOKING_CONFIRMED:${payment.booking._id}`,
      });
    }

    // 2) NOTI cho OWNER: có lượt đặt sân mới
    if (venue?.manager) {
      await createNotification({
        userId: venue.manager,
        type: "NEW_BOOKING",
        level: "INFO",
        title: "Có lượt đặt sân mới",
        content: `Sân "${venue.name}" vừa có booking mới (${payment.booking.code}).`,
        data: {
          bookingId: String(payment.booking._id),
          bookingCode: payment.booking.code,
          venueId: String(venue._id),
          route: "/owner/bookings",
        },
        dedupeKey: `NEW_BOOKING:${payment.booking._id}`,
      });
    }
  }


  return {
    provider: normalized,
    orderId,
    success,
    paymentId: payment._id,
    bookingId: payment.booking?._id || null,
    bookingCode: payment.booking?.code || null,
  };
}
