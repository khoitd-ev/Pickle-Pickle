// backend/src/modules/venueContent/adminVenueContent.controller.js
import fs from "node:fs";
import { promises as fsp } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  getAdminVenueContent,
  updateAdminVenueContent,
} from "./venueContent.service.js";
import { assertAdminManager } from "../users/user.service.js";

// === Cấu hình thư mục uploads giống bên owner ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gốc: backend/uploads
const UPLOAD_ROOT = path.join(__dirname, "..", "..", "..", "uploads");

function getUserId(request) {
  return request.user?.id || request.user?._id || request.userId;
}

// ================== GET CONTENT (ADMIN) ==================
export async function getAdminVenueContentHandler(request, reply) {
  try {
    const adminId = getUserId(request);
    await assertAdminManager(adminId); // chỉ cho admin dùng

    const { venueId } = request.params;
    const data = await getAdminVenueContent(venueId);

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

// ================== UPDATE CONTENT (ADMIN) ==================
export async function updateAdminVenueContentHandler(request, reply) {
  try {
    const adminId = getUserId(request);
    await assertAdminManager(adminId);

    const { venueId } = request.params;
    const payload = request.body || {};

    const data = await updateAdminVenueContent(venueId, payload);
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}

// ================== UPLOAD ẢNH CONTENT (ADMIN) ==================
/**
 * Upload ảnh (hero / highlight / amenity / avatar) cho content – phía ADMIN
 * FE gọi: POST /api/admin/venues/:venueId/content/upload-image
 * body: form-data { image, purpose? }
 *
 * purpose: "hero" | "highlight" | "amenity" | "avatar" | "content"
 */
export async function uploadAdminVenueContentImageHandler(request, reply) {
  try {
    const adminId = getUserId(request);
    await assertAdminManager(adminId);

    const { venueId } = request.params;

    const filePart = await request.file(); // fastify-multipart
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
    // uploads/admin/venues/{venueId}/content/{subFolder}
    const targetDir = path.join(
      UPLOAD_ROOT,
      "admin",
      "venues",
      String(venueId),
      "content",
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
    const publicUrl = `/uploads/admin/venues/${venueId}/content/${subFolder}/${fileName}`;

    return reply.send({ imageUrl: publicUrl });
  } catch (err) {
    request.log.error(err);
    const status = err.statusCode || 500;
    return reply.code(status).send({ message: err.message });
  }
}
