// src/modules/addons/ownerAddon.controller.js
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  listOwnerAddonsService,
  createOwnerAddonService,
  updateOwnerAddonService,
  deleteOwnerAddonService,
  assertOwnerVenue,
} from "./ownerAddon.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục gốc lưu uploads (backend/uploads/...)
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");

function getOwnerIdFromRequest(request) {
  // Tuỳ theo requireAuth gán gì – chỉnh cho đúng
  // Mặc định: request.user.id hoặc request.user._id
  return request.user?.id || request.user?._id || request.userId;
}

export async function listOwnerAddonsHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;

    const addons = await listOwnerAddonsService(ownerId, venueId);

    return reply.send({ data: addons });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

export async function createOwnerAddonHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;
    const payload = request.body || {};

    const addon = await createOwnerAddonService(ownerId, venueId, payload);

    return reply.code(201).send({ data: addon });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

export async function updateOwnerAddonHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId, addonId } = request.params;
    const payload = request.body || {};

    const addon = await updateOwnerAddonService(
      ownerId,
      venueId,
      addonId,
      payload
    );

    return reply.send({ data: addon });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

export async function deleteOwnerAddonHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId, addonId } = request.params;

    const result = await deleteOwnerAddonService(ownerId, venueId, addonId);

    return reply.send(result);
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

export async function uploadOwnerAddonImageHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;

    // Kiểm tra owner có quyền trên venue
    await assertOwnerVenue(ownerId, venueId);

    const filePart = await request.file(); // từ fastify-multipart
    if (!filePart) {
      return reply.code(400).send({ message: "Thiếu file upload." });
    }

    const originalName = filePart.filename || "addon-image";
    const ext = path.extname(originalName) || ".jpg";

    // Đường dẫn thư mục: uploads/owners/{ownerId}/venues/{venueId}/addons
    const targetDir = path.join(
      UPLOAD_ROOT,
      "owners",
      String(ownerId),
      "venues",
      String(venueId),
      "addons"
    );

    await fsp.mkdir(targetDir, { recursive: true });

    const fileName = `${Date.now()}${ext}`;
    const filePath = path.join(targetDir, fileName);

    // Ghi stream ra file
    await new Promise((resolve, reject) => {
      const stream = fs.createWriteStream(filePath);
      filePart.file.pipe(stream);
      stream.on("finish", resolve);
      stream.on("error", reject);
    });

    // URL public để FE dùng
    const publicUrl = `/uploads/owners/${ownerId}/venues/${venueId}/addons/${fileName}`;

    return reply.send({ imageUrl: publicUrl });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}
