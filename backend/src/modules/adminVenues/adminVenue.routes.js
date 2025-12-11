// backend/src/modules/adminVenues/adminVenue.routes.js
import { requireAuth } from "../../shared/middlewares/requireAuth.js";
import {
    listAdminVenuesHandler,
    createAdminVenueHandler,
    updateAdminVenueHandler,
    deleteAdminVenueHandler,
    adminGetVenueConfigHandler,
    adminUpsertVenueConfigHandler,
} from "./adminVenue.controller.js";

export async function adminVenueRoutes(app, opts) {
    app.get(
        "/admin/venues",
        { preHandler: [requireAuth] },
        listAdminVenuesHandler
    );

    app.post(
        "/admin/venues",
        { preHandler: [requireAuth] },
        createAdminVenueHandler
    );

    app.put(
        "/admin/venues/:venueId",
        { preHandler: [requireAuth] },
        updateAdminVenueHandler
    );

    app.delete(
        "/admin/venues/:venueId",
        { preHandler: [requireAuth] },
        deleteAdminVenueHandler
    );

    // ===== CONFIG (openTime / closeTime / priceRules) cho ADMIN =====
    app.get(
        "/admin/venues/:venueId/config",
        { preHandler: [requireAuth] },
        adminGetVenueConfigHandler
    );

    app.put(
        "/admin/venues/:venueId/config",
        { preHandler: [requireAuth] },
        adminUpsertVenueConfigHandler
    );
}
