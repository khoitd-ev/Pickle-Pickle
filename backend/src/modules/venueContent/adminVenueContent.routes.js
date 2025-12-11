// backend/src/modules/venueContent/adminVenueContent.routes.js
import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
  getAdminVenueContentHandler,
  updateAdminVenueContentHandler,
  uploadAdminVenueContentImageHandler,
} from "./adminVenueContent.controller.js";

export default async function adminVenueContentRoutes(app, opts) {
  app.addHook("onRequest", requireAuth);

  // GET /api/admin/venues/:venueId/content
  app.get(
    "/admin/venues/:venueId/content",
    { schema: { params: { type: "object", required: ["venueId"], properties: { venueId: { type: "string" } } } } },
    getAdminVenueContentHandler
  );

  // PUT /api/admin/venues/:venueId/content
  app.put(
    "/admin/venues/:venueId/content",
    {
      schema: {
        params: { type: "object", required: ["venueId"], properties: { venueId: { type: "string" } } },
        body: { type: "object" }, // giống schema bên owner nếu muốn strict
      },
    },
    updateAdminVenueContentHandler
  );

  // POST /api/admin/venues/:venueId/content/upload-image
  app.post(
    "/admin/venues/:venueId/content/upload-image",
    {
      schema: {
        params: { type: "object", required: ["venueId"], properties: { venueId: { type: "string" } } },
      },
    },
    uploadAdminVenueContentImageHandler
  );
}
