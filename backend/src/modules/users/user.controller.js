// src/modules/users/user.controller.js
import {
    listAdminsService,
    createAdminService,
    updateAdminService,
    deleteAdminService,
    listCustomerUsersService,
    createCustomerUserService,
    updateCustomerUserService,
    deleteCustomerUserService,
    listOwnerUsersService,
    createOwnerUserService,
    updateOwnerUserService,
    deleteOwnerUserService,
    getMeService,
    updateMeService,
    changeMyPasswordService,
} from "./user.service.js";


import { HttpError } from "../../shared/errors/httpError.js";

function getCurrentUserId(request) {
    return request.user?.id || request.user?._id || request.userId;
}

export async function listAdminsHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const admins = await listAdminsService(currentUserId);
        return reply.send({ data: admins });
    } catch (err) {
        request.log.error(err);
        const status = err.status || err.statusCode || 500;
        return reply.code(status).send({ message: err.message });
    }
}

export async function createAdminHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const admin = await createAdminService(currentUserId, request.body || {});
        return reply.code(201).send({ data: admin });
    } catch (err) {
        request.log.error(err);
        const status = err.status || err.statusCode || 500;
        return reply.code(status).send({ message: err.message });
    }
}

export async function updateAdminHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const { adminId } = request.params;
        const admin = await updateAdminService(
            currentUserId,
            adminId,
            request.body || {}
        );
        return reply.send({ data: admin });
    } catch (err) {
        request.log.error(err);
        const status = err.status || err.statusCode || 500;
        return reply.code(status).send({ message: err.message });
    }
}

export async function deleteAdminHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const { adminId } = request.params;
        await deleteAdminService(currentUserId, adminId);
        return reply.code(204).send();
    } catch (err) {
        request.log.error(err);
        const status = err.status || err.statusCode || 500;
        return reply.code(status).send({ message: err.message });
    }
}
// ==============================
// CUSTOMER HANDLERS (ADMIN MANAGE CUSTOMERS)
// ==============================

export async function listCustomersHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const { q, status } = request.query || {};

        const users = await listCustomerUsersService(currentUserId, {
            search: q,
            status: status || "all",
        });

        return reply.send({ data: users });
    } catch (err) {
        request.log.error(err);
        const statusCode = err.status || err.statusCode || 500;
        return reply.code(statusCode).send({ message: err.message });
    }
}

export async function createCustomerHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const user = await createCustomerUserService(
            currentUserId,
            request.body || {}
        );
        return reply.code(201).send({ data: user });
    } catch (err) {
        request.log.error(err);
        const statusCode = err.status || err.statusCode || 500;
        return reply.code(statusCode).send({ message: err.message });
    }
}

export async function updateCustomerHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const { userId } = request.params;

        const user = await updateCustomerUserService(
            currentUserId,
            userId,
            request.body || {}
        );

        return reply.send({ data: user });
    } catch (err) {
        request.log.error(err);
        const statusCode = err.status || err.statusCode || 500;
        return reply.code(statusCode).send({ message: err.message });
    }
}

export async function deleteCustomerHandler(request, reply) {
    try {
        const currentUserId = getCurrentUserId(request);
        const { userId } = request.params;

        await deleteCustomerUserService(currentUserId, userId);

        return reply.code(204).send();
    } catch (err) {
        request.log.error(err);
        const statusCode = err.status || err.statusCode || 500;
        return reply.code(statusCode).send({ message: err.message });
    }
}


export async function listOwnersHandler(req, reply) {
    const adminId = req.user.id;
    const { q = "", status = "ALL" } = req.query || {};

    const data = await listOwnerUsersService(adminId, {
        search: q,
        status,
    });

    return reply.send(data);
}

export async function createOwnerHandler(req, reply) {
    const adminId = req.user.id;
    const payload = req.body || {};

    const created = await createOwnerUserService(adminId, payload);
    return reply.code(201).send(created);
}

export async function updateOwnerHandler(req, reply) {
    const adminId = req.user.id;
    const { ownerId } = req.params;
    const payload = req.body || {};

    const updated = await updateOwnerUserService(adminId, ownerId, payload);
    return reply.send(updated);
}

export async function deleteOwnerHandler(req, reply) {
    const adminId = req.user.id;
    const { ownerId } = req.params;

    const result = await deleteOwnerUserService(adminId, ownerId);
    return reply.send(result);
}



export async function getMeHandler(request, reply) {
  const userId = request.user?.id;
  const user = await getMeService(userId);
  return reply.send({ user });
}

export async function updateMeHandler(request, reply) {
  const userId = request.user?.id;
  const updated = await updateMeService(userId, request.body || {});
  return reply.send({ user: updated });
}

export async function changeMyPasswordHandler(request, reply) {
  const userId = request.user?.id;
  const { currentPassword, newPassword } = request.body || {};
  await changeMyPasswordService(userId, { currentPassword, newPassword });
  return reply.send({ ok: true });
}