// backend/src/modules/venueContent/ownerVenueContent.controller.js
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getOwnerVenueContent,
  updateOwnerVenueContent,
} from "./venueContent.service.js";
import { assertOwnerVenue } from "../addons/ownerAddon.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục gốc lưu uploads (backend/uploads/.)
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");


function getOwnerIdFromRequest(request) {
  return request.user?.id || request.user?._id || request.userId;
}

export async function getOwnerVenueContentHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;

    const data = await getOwnerVenueContent(ownerId, venueId);
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

export async function updateOwnerVenueContentHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;
    const payload = request.body || {};

    const data = await updateOwnerVenueContent(ownerId, venueId, payload);
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

/**
 * Upload ảnh (hero / highlight / amenity / avatar) cho content
 * FE gọi: POST /owner/venues/:venueId/content/upload-image
 * body: form-data { image, purpose? }
 */
export async function uploadOwnerVenueContentImageHandler(request, reply) {
  try {
    const ownerId = getOwnerIdFromRequest(request);
    const { venueId } = request.params;

    // check quyền
    await assertOwnerVenue(ownerId, venueId);

    const filePart = await request.file(); // từ fastify-multipart
    if (!filePart) {
      return reply.code(400).send({ message: "Thiếu file upload." });
    }

    const originalName = filePart.filename || "venue-content-image";
    const ext = path.extname(originalName) || ".jpg";

    // Lấy purpose từ field (hero | highlight | amenity | avatar | content)
    const fields = filePart.fields || {};
    const purposeRaw =
      (fields.purpose && fields.purpose.value) ||
      fields.purpose ||
      "content";

    const purpose = String(purposeRaw || "content").toLowerCase();

    const subFolder =
      purpose === "hero"
        ? "hero"
        : purpose === "highlight"
        ? "highlight"
        : purpose === "amenity"
        ? "amenity"
        : purpose === "avatar"
        ? "avatar"
        : "content";

    // Đường dẫn thư mục:
    // uploads/owners/{ownerId}/venues/{venueId}/addons/{subFolder}
    const targetDir = path.join(
      UPLOAD_ROOT,
      "owners",
      String(ownerId),
      "venues",
      String(venueId),
      "addons",
      subFolder
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
    const publicUrl = `/uploads/owners/${ownerId}/venues/${venueId}/addons/${subFolder}/${fileName}`;

    return reply.send({ imageUrl: publicUrl });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}
