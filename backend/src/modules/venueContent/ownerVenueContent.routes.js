// backend/src/modules/venueContent/ownerVenueContent.routes.js
import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
  getOwnerVenueContentHandler,
  updateOwnerVenueContentHandler,
  uploadOwnerVenueContentImageHandler,
} from "./ownerVenueContent.controller.js";

export default async function ownerVenueContentRoutes(app, opts) {
  // tất cả route ở đây require owner login
  app.addHook("onRequest", requireAuth);

  // GET /owner/venues/:venueId/content
  app.get(
    "/venues/:venueId/content",
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
    getOwnerVenueContentHandler
  );

  // PUT /owner/venues/:venueId/content
  app.put(
    "/venues/:venueId/content",
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
          properties: {
            heroTitle: { type: "string" },
            heroSubtitle: { type: "string" },
            heroTagline: { type: "string" },

            overviewTitle: { type: "string" },
            overviewDescription: { type: "string" },

            highlightTitle: { type: "string" },
            highlightDescription: { type: "string" },

            amenityTitle: { type: "string" },
            amenityDescription: { type: "string" },

            pricingTitle: { type: "string" },
            pricingDescription: { type: "string" },
            pricingNote: { type: "string" },

            heroImages: { type: "array", items: { type: "string" } },
            highlightImages: { type: "array", items: { type: "string" } },
            amenityImages: { type: "array", items: { type: "string" } },

            leftFeatures: { type: "array", items: { type: "string" } },
            rightFeatures: { type: "array", items: { type: "string" } },
            leftAmenities: { type: "array", items: { type: "string" } },
            rightAmenities: { type: "array", items: { type: "string" } },
          },
        },
      },
    },
    updateOwnerVenueContentHandler
  );

  // POST /owner/venues/:venueId/content/upload-image
  app.post(
    "/venues/:venueId/content/upload-image",
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
    uploadOwnerVenueContentImageHandler
  );
}
