// backend/src/modules/adminVenues/adminVenue.controller.js
import {
  listVenuesService,
  createVenueService,
  updateVenueService,
  deleteVenueService,
  getVenueConfigForAdmin,
  upsertVenueConfigForAdmin,
} from "./adminVenue.service.js";

export async function listAdminVenuesHandler(req, reply) {
  const adminId = req.user.id;
  const { q = "", status = "ALL", ownerId } = req.query || {};

  const data = await listVenuesService(adminId, {
    search: q,
    status,
    ownerId,
  });

  return reply.send(data);
}

export async function createAdminVenueHandler(req, reply) {
  const adminId = req.user.id;
  const payload = req.body || {};

  const created = await createVenueService(adminId, payload);
  return reply.code(201).send(created);
}

export async function updateAdminVenueHandler(req, reply) {
  const adminId = req.user.id;
  const { venueId } = req.params;
  const payload = req.body || {};

  const updated = await updateVenueService(adminId, venueId, payload);
  return reply.send(updated);
}

export async function deleteAdminVenueHandler(req, reply) {
  const adminId = req.user.id;
  const { venueId } = req.params;

  const result = await deleteVenueService(adminId, venueId);
  return reply.send(result);
}


// GET /admin/venues/:venueId/config
export async function adminGetVenueConfigHandler(req, reply) {
  const adminId = req.user.id;
  const { venueId } = req.params;

  const data = await getVenueConfigForAdmin(adminId, venueId);
  return reply.send(data);
}

// PUT /admin/venues/:venueId/config
export async function adminUpsertVenueConfigHandler(req, reply) {
  const adminId = req.user.id;
  const { venueId } = req.params;
  const payload = req.body || {};

  const data = await upsertVenueConfigForAdmin(adminId, venueId, payload);
  return reply.send(data);
}
