import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
  listOwnerAddonsHandler,
  createOwnerAddonHandler,
  updateOwnerAddonHandler,
  deleteOwnerAddonHandler,
  uploadOwnerAddonImageHandler,
} from "./ownerAddon.controller.js";

export default async function ownerAddonRoutes(app, opts) {
  // Tất cả routes ở đây đều cần login owner
  app.addHook("onRequest", requireAuth);

  // GET /owner/venues/:venueId/addons
  app.get(
    "/venues/:venueId/addons",
    {
      schema: {
        params: {
          type: "object",
          required: ["venueId"],
          properties: {
            venueId: { type: "string" },
          },
        },
      },
    },
    listOwnerAddonsHandler
  );

  // POST /owner/venues/:venueId/addons
  app.post(
    "/venues/:venueId/addons",
    {
      schema: {
        params: {
          type: "object",
          required: ["venueId"],
          properties: {
            venueId: { type: "string" },
          },
        },
        body: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string" },
            price: { type: ["number", "string"] },
            stock: { type: ["number", "string"], nullable: true },
            code: { type: "string", nullable: true },
            category: {
              type: "string",
              enum: ["equipment", "drink", "support", "other"],
              nullable: true,
            },
            categoryLabel: { type: "string", nullable: true },
            imageUrl: { type: "string", nullable: true },
          },
        },
      },
    },
    createOwnerAddonHandler
  );

  // PUT /owner/venues/:venueId/addons/:addonId
  app.put(
    "/venues/:venueId/addons/:addonId",
    {
      schema: {
        params: {
          type: "object",
          required: ["venueId", "addonId"],
          properties: {
            venueId: { type: "string" },
            addonId: { type: "string" },
          },
        },
        body: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: ["number", "string"] },
            stock: { type: ["number", "string"] },
            category: {
              type: "string",
              enum: ["equipment", "drink", "support", "other"],
            },
            categoryLabel: { type: "string" },
            imageUrl: { type: "string" },
          },
        },
      },
    },
    updateOwnerAddonHandler
  );

  // DELETE /owner/venues/:venueId/addons/:addonId
  app.delete(
    "/venues/:venueId/addons/:addonId",
    {
      schema: {
        params: {
          type: "object",
          required: ["venueId", "addonId"],
          properties: {
            venueId: { type: "string" },
            addonId: { type: "string" },
          },
        },
      },
    },
    deleteOwnerAddonHandler
  );

  // Upload ảnh addon
  app.post(
    "/venues/:venueId/addons/upload-image",
    {
      schema: {
        params: {
          type: "object",
          required: ["venueId"],
          properties: {
            venueId: { type: "string" },
          },
        },
      },
    },
    uploadOwnerAddonImageHandler
  );
}
