// src/modules/addons/addon.routes.js
import {
  listAddonsHandler,
  getAddonByCodeHandler,
} from "./addon.controller.js";

export default async function addonRoutes(app, opts) {
  // Public: list all addons
  // Optional filter:
  //  - ?category=equipment|drink|support
  //  - ?venueId=<ObjectId sân>  -> để mỗi sân có phụ kiện riêng
  app.get(
    "/addons",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            category: {
              type: "string",
              enum: ["equipment", "drink", "support"],
            },
            venueId: {
              type: "string",
            },
          },
        },
      },
    },
    listAddonsHandler
  );

  // Public: get single addon by code
  app.get(
    "/addons/:code",
    {
      schema: {
        params: {
          type: "object",
          required: ["code"],
          properties: {
            code: { type: "string" },
          },
        },
      },
    },
    getAddonByCodeHandler
  );
}
