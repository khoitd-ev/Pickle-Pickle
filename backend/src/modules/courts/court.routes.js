// src/modules/courts/court.routes.js
import { getVenueDetailHandler } from "./court.controller.js";

export async function courtRoutes(app, opts) {
  // /api/venues/:venueId/detail
  app.get("/venues/:venueId/detail", getVenueDetailHandler);
}
