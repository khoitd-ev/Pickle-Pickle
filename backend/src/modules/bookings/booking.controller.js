// backend/src/modules/bookings/booking.controller.js
import {
  createBookingFromSlots,
  getVenueAvailability,
  SlotConflictError,
  getUserBookingHistory,
  getOwnerDailyOverview,
  getAdminDailyOverview,
  getUserBookingDetail,    
  cancelUserBooking, 
} from "./booking.service.js";
import { Venue } from "../../models/venue.model.js";

// POST /api/bookings
export async function createBookingHandler(request, reply) {
  try {
    const body = request.body || {};
    const authUser = request.user || {};
    const userId = authUser.id || authUser._id;

    if (!userId) {
      return reply
        .code(401)
        .send({ message: "Bạn phải đăng nhập trước khi đặt sân." });
    }

    const payload = {
      userId,
      venueId: body.venueId,
      date: body.date,
      courts: body.courts,
      discount: body.discount,
      note: body.note,
    };

    const result = await createBookingFromSlots(payload);

    return reply.code(201).send({
      data: {
        bookingId: result.booking._id,
        code: result.booking.code,
        grossAmount: result.booking.grossAmount,
        discount: result.booking.discount,
        totalAmount: result.booking.totalAmount,
        status: "PENDING_PAYMENT",
        items: result.items.map((item) => ({
          id: item._id,
          courtId: item.court._id,
          courtName: item.court.name,
          date: item.date,
          slotStart: item.slotStart,
          slotEnd: item.slotEnd,
          unitPrice: item.unitPrice,
          lineAmount: item.lineAmount,
        })),
      },
    });
  } catch (err) {
    request.log.error(err);

    if (err instanceof SlotConflictError) {
      return reply.code(409).send({
        message:
          err.message ||
          "Một hoặc nhiều khung giờ bạn chọn đã được người khác đặt. Vui lòng chọn lại.",
        conflicts: err.conflicts,
      });
    }

    return reply.code(500).send({
      message: "Không thể tạo booking. Vui lòng thử lại sau.",
    });
  }
}

// GET /api/venues/:venueId/availability?date=YYYY-MM-DD
export async function getVenueAvailabilityHandler(request, reply) {
  try {
    const { venueId } = request.params;
    const { date } = request.query;

    if (!date) {
      return reply
        .code(400)
        .send({ message: "Query param 'date' (YYYY-MM-DD) is required" });
    }

    const data = await getVenueAvailability({ venueId, dateStr: date });

    return reply.code(200).send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không lấy được availability của venue" });
  }
}

// GET /api/bookings/history
export async function getUserBookingHistoryHandler(request, reply) {
  try {
    const user = request.user;
    const userId = user?.id || user?._id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { page, limit, status } = request.query || {};
    const statusCodes =
      typeof status === "string" && status.length
        ? status.split(",")
        : undefined;

    const result = await getUserBookingHistory({
      userId,
      page,
      limit,
      statusCodes,
    });

    return reply.send({ data: result });
  } catch (err) {
    request.log.error(err, "getUserBookingHistoryHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}

// GET /api/owner/bookings/daily?date=YYYY-MM-DD&venueId=...
export async function getOwnerDailyOverviewHandler(request, reply) {
  try {
    const user = request.user;
    const ownerId = user?.id || user?._id;

    if (!ownerId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { date, venueId } = request.query || {};

    if (!date) {
      return reply
        .code(400)
        .send({ message: "Query param 'date' (YYYY-MM-DD) is required" });
    }

    const data = await getOwnerDailyOverview({
      ownerId,
      dateStr: date,
      venueId,
    });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "getOwnerDailyOverviewHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}

// GET /api/owner/venues
export async function getOwnerVenuesHandler(request, reply) {
  try {
    const user = request.user;
    const ownerId = user?.id || user?._id;

    if (!ownerId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const venues = await Venue.find({
      manager: ownerId,
      isActive: true,
    })
      .select("_id name address")
      .sort({ createdAt: 1 })
      .lean();

    const data = venues.map((v) => ({
      id: v._id.toString(),
      name: v.name,
      address: v.address || "",
    }));

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "getOwnerVenuesHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}


// GET /api/admin/bookings/daily?date=YYYY-MM-DD&venueId=...
export async function getAdminDailyOverviewHandler(request, reply) {
  try {
    const { date, venueId } = request.query || {};

    if (!date) {
      return reply
        .code(400)
        .send({ message: "Query param 'date' (YYYY-MM-DD) is required" });
    }

    const data = await getAdminDailyOverview({
      dateStr: date,
      venueId,
    });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "getAdminDailyOverviewHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}


export async function getUserBookingDetailHandler(request, reply) {
  try {
    const user = request.user;
    const userId = user?.id || user?._id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { bookingId } = request.params;

    const data = await getUserBookingDetail({ userId, bookingId });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "getUserBookingDetailHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}



export async function cancelUserBookingHandler(request, reply) {
  try {
    const user = request.user;
    const userId = user?.id || user?._id;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const { bookingId } = request.params;

    const data = await cancelUserBooking({ userId, bookingId });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err, "cancelUserBookingHandler error");
    const statusCode = err.statusCode || 500;
    return reply
      .code(statusCode)
      .send({ message: err.message || "Internal server error" });
  }
}

