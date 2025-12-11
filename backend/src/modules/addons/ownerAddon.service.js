import mongoose from "mongoose";
import { Addon } from "../../models/addon.model.js";
import { Venue } from "../../models/venue.model.js";

const CATEGORY_ENUM = ["equipment", "drink", "support", "other"];

const CATEGORY_LABELS = {
  equipment: "Dụng cụ",
  drink: "Đồ uống",
  support: "Phụ trợ",
  other: "Khác",
};

function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

// Kiểm tra owner có quyền trên venue không
export async function assertOwnerVenue(ownerId, venueId) {
  const venue = await Venue.findOne({
    _id: venueId,
    manager: ownerId,
  }).lean();

  if (!venue) {
    const err = new Error("Bạn không có quyền trên sân này.");
    err.statusCode = 403;
    throw err;
  }

  return venue;
}

// Lấy danh sách addons theo venue (dùng trong trang owner)
export async function listOwnerAddonsService(ownerId, venueId) {
  await assertOwnerVenue(ownerId, venueId);

  const addons = await Addon.find({
    venue: venueId,
    isActive: true,
  })
    .sort({ name: 1 })
    .lean();

  return addons.map((a) => ({
    id: a.code,
    mongoId: a._id,
    name: a.name,
    price: a.price,
    stock: a.stock ?? 0,
    category: a.category,
    categoryLabel: a.categoryLabel,
    imageUrl: a.imageUrl,
  }));
}

// Tạo addon mới cho venue
export async function createOwnerAddonService(ownerId, venueId, payload) {
  const venue = await assertOwnerVenue(ownerId, venueId);

  const {
    name,
    price,
    stock,
    code, // optional – nếu FE không gửi thì generate từ name
    category,
    categoryLabel,
    imageUrl = "",
  } = payload;

  if (!name || typeof name !== "string") {
    const err = new Error("Tên sản phẩm không hợp lệ.");
    err.statusCode = 400;
    throw err;
  }

  const priceNumber = Number(price);
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    const err = new Error("Đơn giá không hợp lệ.");
    err.statusCode = 400;
    throw err;
  }

  const stockNumber = stock != null ? Number(stock) : 0;
  if (!Number.isFinite(stockNumber) || stockNumber < 0) {
    const err = new Error("Số lượng không hợp lệ.");
    err.statusCode = 400;
    throw err;
  }

  // Chuẩn hoá category
  let finalCategory = category || "support";
  if (!CATEGORY_ENUM.includes(finalCategory)) {
    finalCategory = "support";
  }

  let finalCategoryLabel =
    categoryLabel ||
    CATEGORY_LABELS[finalCategory] ||
    "Phụ trợ";

  // code: nếu FE không gửi thì generate
  const baseCode =
    code && typeof code === "string"
      ? code
      : name
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

  const uniqueCode = `${baseCode}-${Date.now().toString(36)}`;

  const addon = await Addon.create({
    code: uniqueCode,
    name,
    category: finalCategory,
    categoryLabel: finalCategoryLabel,
    price: priceNumber,
    stock: stockNumber,
    imageUrl,
    venue: venue._id,
    isActive: true,
  });

  return {
    id: addon.code,
    mongoId: addon._id,
    name: addon.name,
    price: addon.price,
    stock: addon.stock ?? 0,
    category: addon.category,
    categoryLabel: addon.categoryLabel,
    imageUrl: addon.imageUrl,
    venue: addon.venue,
  };
}

// Cập nhật addon
export async function updateOwnerAddonService(
  ownerId,
  venueId,
  addonId,
  payload
) {
  await assertOwnerVenue(ownerId, venueId);

  const update = {};

  if (payload.name != null) update.name = payload.name;

  if (payload.price != null) {
    const p = Number(payload.price);
    if (!Number.isFinite(p) || p < 0) {
      const err = new Error("Đơn giá không hợp lệ.");
      err.statusCode = 400;
      throw err;
    }
    update.price = p;
  }

  if (payload.stock != null) {
    const s = Number(payload.stock);
    if (!Number.isFinite(s) || s < 0) {
      const err = new Error("Số lượng không hợp lệ.");
      err.statusCode = 400;
      throw err;
    }
    update.stock = s;
  }

  // Cho phép đổi category + categoryLabel
  if (payload.category != null) {
    const cat = payload.category;
    if (!CATEGORY_ENUM.includes(cat)) {
      const err = new Error("Danh mục không hợp lệ.");
      err.statusCode = 400;
      throw err;
    }
    update.category = cat;

    // Nếu FE không gửi categoryLabel mới thì tự map theo category
    if (payload.categoryLabel == null) {
      update.categoryLabel = CATEGORY_LABELS[cat] || "Phụ trợ";
    }
  }

  if (payload.categoryLabel != null) {
    update.categoryLabel = payload.categoryLabel;
  }

  if (payload.imageUrl != null) update.imageUrl = payload.imageUrl;

  const addon = await Addon.findOneAndUpdate(
    { _id: addonId, venue: venueId },
    { $set: update },
    { new: true }
  ).lean();

  if (!addon) {
    const err = new Error("Không tìm thấy sản phẩm.");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: addon.code,
    mongoId: addon._id,
    name: addon.name,
    price: addon.price,
    stock: addon.stock ?? 0,
    category: addon.category,
    categoryLabel: addon.categoryLabel,
    imageUrl: addon.imageUrl,
    venue: addon.venue,
  };
}

// Xoá (soft delete: isActive = false)
export async function deleteOwnerAddonService(ownerId, venueId, addonId) {
  await assertOwnerVenue(ownerId, venueId);

  const addon = await Addon.findOneAndUpdate(
    { _id: addonId, venue: venueId },
    { $set: { isActive: false } },
    { new: true }
  ).lean();

  if (!addon) {
    const err = new Error("Không tìm thấy sản phẩm.");
    err.statusCode = 404;
    throw err;
  }

  return {
    success: true,
  };
}
