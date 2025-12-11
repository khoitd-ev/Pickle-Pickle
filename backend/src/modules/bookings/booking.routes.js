// backend/src/modules/bookings/booking.routes.js
import {
  createBookingHandler,
  getVenueAvailabilityHandler,
  getUserBookingHistoryHandler,
  getOwnerDailyOverviewHandler,
  getOwnerVenuesHandler,
  getAdminDailyOverviewHandler,
  getUserBookingDetailHandler,
  cancelUserBookingHandler,
} from "./booking.controller.js";
import { requireAuth } from "../../shared/middlewares/requireAuth.js";

export async function bookingRoutes(app, opts) {
  // Tạo booking - BẮT BUỘC ĐĂNG NHẬP
  app.post(
    "/bookings",
    { preHandler: [requireAuth] },
    createBookingHandler
  );

  // Availability theo venue + ngày (cho FE user & owner)
  app.get(
    "/venues/:venueId/availability",
    getVenueAvailabilityHandler
  );

  // Lịch sử đặt sân của user
  app.get(
    "/bookings/history",
    { onRequest: [requireAuth] },
    getUserBookingHistoryHandler
  );

  // Danh sách venue thuộc owner hiện tại
  app.get(
    "/owner/venues",
    { preHandler: [requireAuth] },
    getOwnerVenuesHandler
  );

  // Overview đặt sân trong 1 ngày cho owner
  app.get(
    "/owner/bookings/daily",
    { preHandler: [requireAuth] },
    getOwnerDailyOverviewHandler
  );
  // Overview đặt sân trong 1 ngày cho ADMIN (xem mọi sân)
  app.get(
    "/admin/bookings/daily",
    { preHandler: [requireAuth] },
    getAdminDailyOverviewHandler
  );

  // Chi tiết 1 booking của user (dùng cho popup hóa đơn)
  app.get(
    "/bookings/:bookingId",
    { onRequest: [requireAuth] },
    getUserBookingDetailHandler
  );

  // Hủy 1 booking của user
  app.post(
    "/bookings/:bookingId/cancel",
    { onRequest: [requireAuth] },
    cancelUserBookingHandler
  );
}
