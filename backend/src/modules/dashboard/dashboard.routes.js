// backend/src/modules/dashboard/dashboard.routes.js
import {
  // OWNER
  getOwnerDashboardSummaryHandler,
  getOwnerRevenueStatsHandler,
  getOwnerBookingStatsHandler,
  getOwnerBookingStatusHandler,
  // REPORTS OWNER
  getOwnerRevenueReportHandler,
  getOwnerBookingReportHandler,
  // ADMIN
  getAdminDashboardSummaryHandler,
  getAdminRevenueStatsHandler,
  getAdminBookingStatsHandler,
  getAdminBookingStatusHandler,
  getAdminTopCourtsHandler,
  getAdminOwnersWithVenuesHandler,
} from "./dashboard.controller.js";

import { requireAuth } from "../../shared/middlewares/requireAuth.js";

export async function dashboardRoutes(app, opts) {
  // ================= OWNER DASHBOARD =================
  app.get(
    "/owner/dashboard/summary",
    { preHandler: [requireAuth] },
    getOwnerDashboardSummaryHandler
  );

  app.get(
    "/owner/dashboard/revenue",
    { preHandler: [requireAuth] },
    getOwnerRevenueStatsHandler
  );

  app.get(
    "/owner/dashboard/bookings",
    { preHandler: [requireAuth] },
    getOwnerBookingStatsHandler
  );

  app.get(
    "/owner/dashboard/booking-status",
    { preHandler: [requireAuth] },
    getOwnerBookingStatusHandler
  );

  // ================= OWNER REPORTS =================
  // Báo cáo doanh thu (Tổng quan doanh thu)
  app.get(
    "/owner/reports/revenue",
    { preHandler: [requireAuth] },
    getOwnerRevenueReportHandler
  );

  // Báo cáo đặt sân (thống kê theo khung giờ)
  app.get(
    "/owner/reports/bookings",
    { preHandler: [requireAuth] },
    getOwnerBookingReportHandler
  );

  // ================= ADMIN DASHBOARD =================
  // 1. Summary toàn hệ thống (hoặc lọc theo owner / venue sau này)
  app.get(
    "/admin/dashboard/summary",
    { preHandler: [requireAuth] },
    getAdminDashboardSummaryHandler
  );

  // 2. Line chart doanh thu + user
  app.get(
    "/admin/dashboard/revenue",
    { preHandler: [requireAuth] },
    getAdminRevenueStatsHandler
  );

  // 3. Bar chart lượt đặt theo khung giờ
  app.get(
    "/admin/dashboard/bookings",
    { preHandler: [requireAuth] },
    getAdminBookingStatsHandler
  );

  // 4. Donut trạng thái booking
  app.get(
    "/admin/dashboard/booking-status",
    { preHandler: [requireAuth] },
    getAdminBookingStatusHandler
  );

  // 5. Top sân có lượt đặt cao nhất (để vẽ bar chart + list bên phải)
  app.get(
    "/admin/dashboard/top-courts",
    { preHandler: [requireAuth] },
    getAdminTopCourtsHandler
  );

  // 6. Danh sách chủ sân + venue (dropdown filter ở FE)
  app.get(
    "/admin/dashboard/owners",
    { preHandler: [requireAuth] },
    getAdminOwnersWithVenuesHandler
  );
}
