// backend/src/modules/dashboard/dashboard.controller.js
import {
  // OWNER
  getOwnerDashboardSummary,
  getOwnerRevenueStats,
  getOwnerBookingStats,
  getOwnerBookingStatus,
  // REPORTS OWNER
  getOwnerRevenueReport,
  getOwnerBookingReport,
  // ADMIN
  getAdminDashboardSummary,
  getAdminRevenueStats,
  getAdminBookingStats,
  getAdminBookingStatus,
  getAdminTopCourts,
  getAdminOwnersWithVenues,
} from "./dashboard.service.js";


// ================= OWNER HANDLERS =================
export async function getOwnerDashboardSummaryHandler(request, reply) {
  try {
    const owner = request.user;
    const ownerId = owner?.id || owner?._id?.toString();
    const { venueId } = request.query;

    const data = await getOwnerDashboardSummary(ownerId, { venueId });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải summary dashboard." });
  }
}

export async function getOwnerRevenueStatsHandler(request, reply) {
  try {
    const owner = request.user;
    const ownerId = owner?.id || owner?._id?.toString();
    const { range, from, to, venueId } = request.query;

    const data = await getOwnerRevenueStats(ownerId, {
      range,
      from,
      to,
      venueId,
    });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải thống kê doanh thu." });
  }
}

export async function getOwnerBookingStatsHandler(request, reply) {
  try {
    const owner = request.user;
    const ownerId = owner?.id || owner?._id?.toString();
    const { range, from, to, venueId } = request.query;

    const data = await getOwnerBookingStats(ownerId, {
      range,
      from,
      to,
      venueId,
    });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải thống kê booking theo khung giờ." });
  }
}

export async function getOwnerBookingStatusHandler(request, reply) {
  try {
    const owner = request.user;
    const ownerId = owner?.id || owner?._id?.toString();
    const { range, from, to, venueId } = request.query;

    const data = await getOwnerBookingStatus(ownerId, {
      range,
      from,
      to,
      venueId,
    });

    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải trạng thái booking." });
  }
}
export async function getOwnerRevenueReportHandler(request, reply) {
  try {
    const ownerId = request.user.id;
    const { range, from, to } = request.query;
    const data = await getOwnerRevenueReport(ownerId, { range, from, to });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải báo cáo doanh thu." });
  }
}

export async function getOwnerBookingReportHandler(request, reply) {
  try {
    const ownerId = request.user.id;
    const { range, from, to } = request.query;
    const data = await getOwnerBookingReport(ownerId, { range, from, to });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải báo cáo đặt sân." });
  }
}

// ================= ADMIN HANDLERS =================

export async function getAdminDashboardSummaryHandler(request, reply) {
  try {
    const { ownerId, venueId } = request.query;
    const data = await getAdminDashboardSummary({ ownerId, venueId });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải summary dashboard admin." });
  }
}

export async function getAdminRevenueStatsHandler(request, reply) {
  try {
    const { range, from, to, ownerId, venueId } = request.query;
    const data = await getAdminRevenueStats({
      range,
      from,
      to,
      ownerId,
      venueId,
    });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải dữ liệu doanh thu admin." });
  }
}

export async function getAdminBookingStatsHandler(request, reply) {
  try {
    const { range, from, to, ownerId, venueId } = request.query;
    const data = await getAdminBookingStats({
      range,
      from,
      to,
      ownerId,
      venueId,
    });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải dữ liệu đặt sân admin." });
  }
}

export async function getAdminBookingStatusHandler(request, reply) {
  try {
    const { range, from, to, ownerId, venueId } = request.query;
    const data = await getAdminBookingStatus({
      range,
      from,
      to,
      ownerId,
      venueId,
    });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải trạng thái booking admin." });
  }
}

export async function getAdminTopCourtsHandler(request, reply) {
  try {
    const { ownerId, venueId } = request.query;
    const data = await getAdminTopCourts({ ownerId, venueId });
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải top sân đặt nhiều nhất." });
  }
}

export async function getAdminOwnersWithVenuesHandler(request, reply) {
  try {
    const data = await getAdminOwnersWithVenues();
    return reply.send({ data });
  } catch (err) {
    request.log.error(err);
    return reply
      .code(500)
      .send({ message: "Không thể tải danh sách chủ sân." });
  }
}
