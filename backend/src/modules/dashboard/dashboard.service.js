// backend/src/modules/dashboard/dashboard.service.js
import mongoose from "mongoose";
import { Venue } from "../../models/venue.model.js";
import { Court } from "../../models/court.model.js";
import { Booking } from "../../models/booking.model.js";
import { BookingSlot } from "../../models/bookingSlot.model.js";
import { User } from "../../models/user.model.js"; // thêm cho admin


// ================== OWNER SUMMARY ==================
export async function getOwnerDashboardSummary(ownerId, { venueId } = {}) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  // Filter venue theo owner + optional venueId
  const venueFilter = { manager: ownerObjectId };
  if (venueId) {
    try {
      venueFilter._id = new mongoose.Types.ObjectId(venueId);
    } catch (e) {
      // nếu venueId không hợp lệ -> bỏ qua, xem như all
    }
  }

  const venues = await Venue.find(venueFilter, {
    _id: 1,
    isActive: 1,
  }).lean();

  const venueIds = venues.map((v) => v._id);
  const totalVenueCount = venues.length;
  const activeVenueCount = venues.filter((v) => v.isActive !== false).length;

  const activeVenuePercent =
    totalVenueCount > 0 ? (activeVenueCount / totalVenueCount) * 100 : 0;

  // Doanh thu & booking tháng này vs tháng trước
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59,
    999
  );

  const [thisMonthAgg, lastMonthAgg] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const revenueThisMonth = thisMonthAgg[0]?.totalRevenue || 0;
  const bookingsThisMonth = thisMonthAgg[0]?.totalBookings || 0;
  const revenueLastMonth = lastMonthAgg[0]?.totalRevenue || 0;

  const growthPercent =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  return {
    totalRevenueThisMonth: revenueThisMonth,
    growthPercent,
    totalBookingsThisMonth: bookingsThisMonth,
    activeVenuePercent,
  };
}

// ================== REVENUE LINE CHART (OWNER) ==================
export async function getOwnerRevenueStats(
  ownerId,
  { range, from, to, venueId } = {}
) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
  const venueFilter = { manager: ownerObjectId };
  if (venueId) {
    try {
      venueFilter._id = new mongoose.Types.ObjectId(venueId);
    } catch (e) { }
  }

  const venues = await Venue.find(venueFilter, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  if (venueIds.length === 0) {
    return {
      months: Array.from({ length: 12 }, (_, i) => `T${i + 1}`),
      revenue: Array(12).fill(0),
      activeUsers: Array(12).fill(0),
    };
  }

  const revenue = await Booking.aggregate([
    {
      $match: {
        venue: { $in: venueIds },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        activeUsersSet: { $addToSet: "$user" },
      },
    },
    {
      $project: {
        _id: 0,
        month: "$_id.month",
        revenue: 1,
        activeUsers: { $size: "$activeUsersSet" },
      },
    },
    { $sort: { month: 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return {
    months: months.map((m) => `T${m}`),
    revenue: months.map(
      (m) => revenue.find((r) => r.month === m)?.revenue || 0
    ),
    activeUsers: months.map(
      (m) => revenue.find((r) => r.month === m)?.activeUsers || 0
    ),
  };
}


// ================== OWNER REVENUE REPORT (for reports page) ==================
export async function getOwnerRevenueReport(ownerId, { range, from, to } = {}) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  const venues = await Venue.find({ manager: ownerObjectId }, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  // Nếu chưa có venue nào thì trả về 0 + chart rỗng
  if (!venueIds.length) {
    const months = Array.from({ length: 12 }, (_, i) => `T${i + 1}`);
    return {
      summary: {
        totalRevenue: 0,
        weekRevenue: 0,
        monthRevenue: 0,
      },
      chart: {
        months,
        revenue: Array(12).fill(0),
        activeUsers: Array(12).fill(0),
      },
    };
  }

  // Tổng doanh thu all-time
  const [totalAgg] = await Booking.aggregate([
    {
      $match: {
        venue: { $in: venueIds },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalRevenue = totalAgg?.totalRevenue || 0;

  // Doanh thu tuần hiện tại & tháng hiện tại
  const { from: weekStart, to: weekEnd } = resolveDateRange({ range: "week" });
  const { from: monthStart, to: monthEnd } = resolveDateRange({
    range: "month",
  });

  const [weekAgg, monthAgg] = await Promise.all([
    Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          createdAt: { $gte: weekStart, $lte: weekEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    Booking.aggregate([
      {
        $match: {
          venue: { $in: venueIds },
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const weekRevenue = weekAgg?.[0]?.totalRevenue || 0;
  const monthRevenue = monthAgg?.[0]?.totalRevenue || 0;

  // Line chart dùng lại hàm getOwnerRevenueStats (mặc định year)
  const chart = await getOwnerRevenueStats(ownerId, {
    range: range || "year",
    from,
    to,
  });

  return {
    summary: {
      totalRevenue,
      weekRevenue,
      monthRevenue,
    },
    chart,
  };
}



// ================== BOOKING SLOTS BAR CHART (OWNER) ==================
export async function getOwnerBookingStats(
  ownerId,
  { range, from, to, venueId } = {}
) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  // Lấy danh sách venue của owner (và filter venueId nếu có)
  const venueFilter = { manager: ownerObjectId };
  if (venueId) {
    try {
      venueFilter._id = new mongoose.Types.ObjectId(venueId);
    } catch (e) {
      // ignore venueId không hợp lệ
    }
  }

  const venues = await Venue.find(venueFilter, {
    _id: 1,
    slotMinutes: 1,
  }).lean();

  const venueIds = venues.map((v) => v._id);
  if (venueIds.length === 0) return [];

  const slotMinutes = venues[0]?.slotMinutes || 60;

  // PIPELINE giống admin nhưng filter theo venueIds của owner
  const pipeline = [
    {
      $match: {
        date: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: "courts",
        localField: "court",
        foreignField: "_id",
        as: "court",
      },
    },
    { $unwind: "$court" },
    {
      $match: {
        "court.venue": { $in: venueIds },
      },
    },
    {
      $group: {
        _id: "$slotIndex",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ];

  const slots = await BookingSlot.aggregate(pipeline);

  // slotIndex trong DB đang là "giờ bắt đầu" (0..23 hoặc 5..22 tuỳ hệ thống)
  // -> label theo block 2 tiếng: "18-20", "21-23", ...
  const data = slots.map((s) => {
    const startHour = Number(s._id);
    const endHour = startHour + 2;

    return {
      label: `${String(startHour).padStart(2, "0")}-${String(endHour).padStart(2, "0")}`,
      value: s.count,
    };
  });

  return data;

}

// ================== OWNER BOOKING REPORT (for reports page) ==================
export async function getOwnerBookingReport(
  ownerId,
  { range, from, to } = {}
) {
  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);

  const venues = await Venue.find({ manager: ownerObjectId }, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  if (!venueIds.length) {
    return {
      summary: {
        totalWebBookings: 0,
        peakSlot: null,
        monthRevenue: 0,
      },
      chartData: [],
    };
  }

  // Mặc định thống kê theo THÁNG (đúng với mock "Doanh thu tháng")
  const { from: start, to: end } = range || from || to
    ? resolveDateRange({ range, from, to })
    : resolveDateRange({ range: "month" });

  // Tổng lượt đặt + doanh thu trong khoảng thống kê
  const [agg] = await Booking.aggregate([
    {
      $match: {
        venue: { $in: venueIds },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const totalWebBookings = agg?.totalBookings || 0;
  const monthRevenue = agg?.totalRevenue || 0;

  // Bar chart theo khung giờ: reuse getOwnerBookingStats
  const rawSlots = await getOwnerBookingStats(ownerId, {
    range: range || "month",
    from,
    to,
  });

  // FE đang dùng { slot, bookings }
  const chartData = rawSlots.map((s) => ({
    slot: s.label,
    bookings: s.value,
  }));

  // Khung giờ cao điểm
  let peakSlot = null;
  if (chartData.length > 0) {
    const top = chartData.reduce(
      (max, cur) => (cur.bookings > max.bookings ? cur : max),
      chartData[0]
    );
    peakSlot = top.slot;
  }

  return {
    summary: {
      totalWebBookings,
      peakSlot,
      monthRevenue,
    },
    chartData,
  };
}


// ================== BOOKING STATUS DONUT (OWNER) ==================
export async function getOwnerBookingStatus(
  ownerId,
  { range, from, to, venueId } = {}
) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const ownerObjectId = new mongoose.Types.ObjectId(ownerId);
  const venueFilter = { manager: ownerObjectId };

  if (venueId) {
    try {
      venueFilter._id = new mongoose.Types.ObjectId(venueId);
    } catch (e) {
      // ignore invalid venueId, cứ thống kê tất cả sân của owner
    }
  }

  const venues = await Venue.find(venueFilter, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  if (venueIds.length === 0) {
    return [
      { name: "Hoàn thành", value: 0 },
      { name: "Đã huỷ", value: 0 },
    ];
  }

  const statuses = await Booking.aggregate([
    {
      $match: {
        venue: { $in: venueIds },
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: "bookingstatuses",
        localField: "status",
        foreignField: "_id",
        as: "status",
      },
    },
    { $unwind: "$status" },
    {
      $group: {
        _id: "$status.code",
        count: { $sum: 1 },
      },
    },
  ]);

  // Gom nhóm giống admin: "đã xong" = CONFIRMED + COMPLETED
  const FINISHED_CODES = ["CONFIRMED", "COMPLETED"];
  const CANCELLED_CODES = ["CANCELLED", "NO_SHOW"];

  const completed = statuses
    .filter((s) => FINISHED_CODES.includes(s._id))
    .reduce((sum, s) => sum + s.count, 0);

  const cancelled = statuses
    .filter((s) => CANCELLED_CODES.includes(s._id))
    .reduce((sum, s) => sum + s.count, 0);

  return [
    { name: "Hoàn thành", value: completed },
    { name: "Đã huỷ", value: cancelled },
  ];
}




// ================== RANGE HELPER ==================
function resolveDateRange({ range, from, to }) {
  const now = new Date();

  // Custom range
  if (from && to) return { from: new Date(from), to: new Date(to) };

  let start, end;

  switch (range) {
    case "week": {
      const day = now.getDay() || 7; // Monday-based
      start = new Date(now);
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 7);
      end.setHours(23, 59, 59, 999);
      break;
    }

    case "month": {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      break;
    }

    case "year":
    default: {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    }
  }

  return { from: start, to: end };
}

/* ================================================================
 *                      ADMIN DASHBOARD
 * ================================================================ */

// ---------- Summary toàn hệ thống / theo owner / venue ----------
export async function getAdminDashboardSummary({ ownerId, venueId }) {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    0,
    23,
    59,
    59
  );

  // ---- RANGE TUẦN (dùng cho Doanh thu tuần)
  const { from: weekStart, to: weekEnd } = resolveDateRange({ range: "week" });

  // Query venue theo filter (nếu có)
  const venueQuery = {};
  if (ownerId) {
    venueQuery.manager = new mongoose.Types.ObjectId(ownerId);
  }
  if (venueId) {
    venueQuery._id = new mongoose.Types.ObjectId(venueId);
  }

  const venues = await Venue.find(venueQuery, { _id: 1, isActive: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  const totalVenueCount = venues.length;
  const activeVenueCount = venues.filter((v) => v.isActive !== false).length;
  const activeCourtsPercent =
    totalVenueCount > 0 ? (activeVenueCount / totalVenueCount) * 100 : 0;

  // Match booking theo filter venue (nếu có)
  const baseMatchThisMonth = { createdAt: { $gte: thisMonthStart } };
  const baseMatchLastMonth = {
    createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
  };
  const baseMatchWeek = {
    createdAt: { $gte: weekStart, $lte: weekEnd },
  };

  if (venueIds.length > 0) {
    baseMatchThisMonth.venue = { $in: venueIds };
    baseMatchLastMonth.venue = { $in: venueIds };
    baseMatchWeek.venue = { $in: venueIds };
  }

  const [
    thisMonthAgg,
    lastMonthAgg,
    weekAgg,
    totalUsers,
    newUsersThisWeek,
  ] = await Promise.all([
    // Tổng doanh thu & số booking trong tháng hiện tại
    Booking.aggregate([
      { $match: baseMatchThisMonth },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalBookings: { $sum: 1 },
        },
      },
    ]),
    // Tổng doanh thu tháng trước (để tính % growth)
    Booking.aggregate([
      { $match: baseMatchLastMonth },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    // Doanh thu tuần hiện tại
    Booking.aggregate([
      { $match: baseMatchWeek },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
    // User thống kê toàn hệ thống (không filter theo owner/venue)
    User.countDocuments({}),
    // User mới trong tuần (toàn hệ thống)
    (async () => {
      const { from: wStart, to: wEnd } = resolveDateRange({ range: "week" });
      return User.countDocuments({
        createdAt: { $gte: wStart, $lte: wEnd },
      });
    })(),
  ]);

  const revenueThisMonth = thisMonthAgg[0]?.totalRevenue || 0;
  const bookingsThisMonth = thisMonthAgg[0]?.totalBookings || 0;
  const revenueLastMonth = lastMonthAgg[0]?.totalRevenue || 0;
  const weekRevenue = weekAgg[0]?.totalRevenue || 0;

  const growthPercent =
    revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100
      : 0;

  return {
    totalRevenueThisMonth: revenueThisMonth,
    weekRevenue,
    growthPercent,
    totalBookingsThisMonth: bookingsThisMonth,
    activeCourtsPercent,
    totalUsers,
    newUsersThisWeek,
  };
}


// ---------- Revenue line chart (admin) ----------
export async function getAdminRevenueStats({
  range,
  from,
  to,
  ownerId,
  venueId,
}) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const venueQuery = {};
  if (ownerId) {
    venueQuery.manager = new mongoose.Types.ObjectId(ownerId);
  }
  if (venueId) {
    venueQuery._id = new mongoose.Types.ObjectId(venueId);
  }

  const venues = await Venue.find(venueQuery, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  const match = {
    createdAt: { $gte: start, $lte: end },
  };
  if (venueIds.length > 0) {
    match.venue = { $in: venueIds };
  }

  const revenue = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        revenue: { $sum: "$totalAmount" },
        userCount: { $addToSet: "$user" },
      },
    },
    {
      $project: {
        month: "$_id.month",
        revenue: 1,
        activeUsers: { $size: "$userCount" },
      },
    },
    { $sort: { month: 1 } },
  ]);

  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return {
    months: months.map((m) => `T${m}`),
    revenue: months.map(
      (m) => revenue.find((r) => r.month === m)?.revenue || 0
    ),
    activeUsers: months.map(
      (m) => revenue.find((r) => r.month === m)?.activeUsers || 0
    ),
  };
}

// ---------- Booking slots bar chart (admin) ----------
export async function getAdminBookingStats({
  range,
  from,
  to,
  ownerId,
  venueId,
}) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const venueQuery = {};
  if (ownerId) {
    venueQuery.manager = new mongoose.Types.ObjectId(ownerId);
  }
  if (venueId) {
    venueQuery._id = new mongoose.Types.ObjectId(venueId);
  }

  const venues = await Venue.find(venueQuery, {
    _id: 1,
    slotMinutes: 1,
  }).lean();

  const venueIds = venues.map((v) => v._id);
  const slotMinutes = venues[0]?.slotMinutes || 60;

  const pipeline = [
    {
      $match: {
        date: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: "courts",
        localField: "court",
        foreignField: "_id",
        as: "court",
      },
    },
    { $unwind: "$court" },
  ];

  if (venueIds.length > 0) {
    pipeline.push({
      $match: {
        "court.venue": { $in: venueIds },
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: "$slotIndex",
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } }
  );

  const slots = await BookingSlot.aggregate(pipeline);

  const data = slots.map((s) => {
    const startHour = Number(s._id);
    const endHour = startHour + 2;

    return {
      label: `${String(startHour).padStart(2, "0")}-${String(endHour).padStart(2, "0")}`,
      value: s.count,
    };
  });


  return data;

}

// ---------- Booking status donut (admin) ----------
export async function getAdminBookingStatus({
  range,
  from,
  to,
  ownerId,
  venueId,
}) {
  const { from: start, to: end } = resolveDateRange({ range, from, to });

  const venueQuery = {};
  if (ownerId) {
    venueQuery.manager = new mongoose.Types.ObjectId(ownerId);
  }
  if (venueId) {
    venueQuery._id = new mongoose.Types.ObjectId(venueId);
  }

  const venues = await Venue.find(venueQuery, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  const match = {
    createdAt: { $gte: start, $lte: end },
  };
  if (venueIds.length > 0) {
    match.venue = { $in: venueIds };
  }

  const statuses = await Booking.aggregate([
    { $match: match },
    {
      $lookup: {
        from: "bookingstatuses",
        localField: "status",
        foreignField: "_id",
        as: "status",
      },
    },
    { $unwind: "$status" },
    {
      $group: {
        _id: "$status.code",
        count: { $sum: 1 },
      },
    },
  ]);

  const FINISHED_CODES = ["CONFIRMED", "COMPLETED"];
  const CANCELLED_CODES = ["CANCELLED", "NO_SHOW"];

  const completed = statuses
    .filter((s) => FINISHED_CODES.includes(s._id))
    .reduce((sum, s) => sum + s.count, 0);

  const cancelled = statuses
    .filter((s) => CANCELLED_CODES.includes(s._id))
    .reduce((sum, s) => sum + s.count, 0);

  return [
    { name: "Hoàn thành", value: completed },
    { name: "Đã huỷ", value: cancelled },
  ];
}



// ---------- Top courts / venues (admin) ----------
export async function getAdminTopCourts({ ownerId, venueId }) {
  const venueQuery = {};
  if (ownerId) {
    venueQuery.manager = new mongoose.Types.ObjectId(ownerId);
  }
  if (venueId) {
    venueQuery._id = new mongoose.Types.ObjectId(venueId);
  }

  const venues = await Venue.find(venueQuery, { _id: 1 }).lean();
  const venueIds = venues.map((v) => v._id);

  const match = {};
  if (venueIds.length > 0) {
    match.venue = { $in: venueIds };
  }

  const top = await Booking.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$venue",
        bookings: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
      },
    },
    {
      $lookup: {
        from: "venues",
        localField: "_id",
        foreignField: "_id",
        as: "venue",
      },
    },
    { $unwind: "$venue" },
    {
      $project: {
        _id: 0,
        name: "$venue.name",
        bookings: 1,
        revenue: 1,
      },
    },
    { $sort: { bookings: -1 } },
    { $limit: 5 },
  ]);

  // rating hiện chưa có trong DB, tạm để null
  return top.map((item) => ({
    name: item.name,
    bookings: item.bookings,
    revenue: item.revenue,
    rating: null,
  }));
}

// ---------- Owners + venues cho dropdown admin ----------
export async function getAdminOwnersWithVenues() {
  // Lấy tất cả venue có manager
  const venues = await Venue.find(
    { manager: { $ne: null } },
    { _id: 1, name: 1, manager: 1 }
  )
    .populate("manager", "fullName email")
    .lean();

  const map = new Map();

  for (const v of venues) {
    if (!v.manager) continue;
    const ownerId = v.manager._id.toString();
    if (!map.has(ownerId)) {
      map.set(ownerId, {
        id: ownerId,
        name: v.manager.fullName || v.manager.email,
        venues: [],
      });
    }
    map.get(ownerId).venues.push({
      id: v._id.toString(),
      name: v.name,
    });
  }

  return Array.from(map.values());
}
