// src/lib/dashboardApi.js
"use client";

import { apiFetch } from "./apiClient";

// Helper build query string
function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    qs.set(k, String(v));
  });
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* ===================== OWNER ===================== */

// Tổng quan dashboard owner (thẻ thống kê trên dashboard)
export async function fetchOwnerDashboardSummary() {
  const res = await apiFetch("/owner/dashboard/summary");
  return res.data || {};
}

// Line chart doanh thu + active users cho owner
// range: "year" | "month" | "week"
export async function fetchOwnerRevenueStats(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/owner/dashboard/revenue${query}`);
  return res.data || {};
}

// Bar chart lượt đặt theo khung giờ cho owner
export async function fetchOwnerBookingStats(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/owner/dashboard/bookings${query}`);
  return res.data || [];
}

// Donut trạng thái booking cho owner
export async function fetchOwnerBookingStatus(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/owner/dashboard/booking-status${query}`);
  return res.data || [];
}

// Báo cáo doanh thu (trang Báo cáo & phân tích – Doanh thu)
export async function fetchOwnerRevenueReport(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/owner/reports/revenue${query}`);
  return res.data || {
    summary: { totalRevenue: 0, weekRevenue: 0, monthRevenue: 0 },
    chart: { months: [], revenue: [], activeUsers: [] },
  };
}

// Báo cáo đặt sân (trang Báo cáo & phân tích – Đặt sân)
export async function fetchOwnerBookingReport(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/owner/reports/bookings${query}`);
  return res.data || {
    summary: { totalWebBookings: 0, peakSlot: null, monthRevenue: 0 },
    chartData: [],
  };
}

/* ===================== ADMIN ===================== */

// Summary tổng quan admin (doanh thu, tăng trưởng, user, % sân active...)
export async function fetchAdminDashboardSummary(filters = {}) {
  const query = buildQuery(filters); // { ownerId, venueId }
  const res = await apiFetch(`/admin/dashboard/summary${query}`);
  return res.data || {};
}

// Line chart doanh thu + active users admin
export async function fetchAdminRevenueStats(params = {}) {
  const query = buildQuery(params); // { range, from, to, ownerId, venueId }
  const res = await apiFetch(`/admin/dashboard/revenue${query}`);
  return res.data || {};
}

// Bar chart lượt đặt theo khung giờ admin
export async function fetchAdminBookingStats(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/admin/dashboard/bookings${query}`);
  return res.data || [];
}

// Donut trạng thái booking admin
export async function fetchAdminBookingStatus(params = {}) {
  const query = buildQuery(params);
  const res = await apiFetch(`/admin/dashboard/booking-status${query}`);
  return res.data || [];
}

// Top sân (cho chart TopCourts + list)
export async function fetchAdminTopCourts(filters = {}) {
  const query = buildQuery(filters);
  const res = await apiFetch(`/admin/dashboard/top-courts${query}`);
  return res.data || [];
}

// Danh sách chủ sân + venue (dropdown filter)
export async function fetchAdminOwnersWithVenues() {
  const res = await apiFetch("/admin/dashboard/owners");
  return res.data || [];
}

/* ===================== OWNER – HỖ TRỢ ĐẶT SÂN ===================== */

// Danh sách venue của owner (dùng cho dropdown filter / chọn sân)
export async function fetchOwnerVenues() {
  const res = await apiFetch("/owner/venues");
  return res.data || [];
}

// Overview đặt sân 1 ngày cho owner (dùng sau, khi làm trang lịch)
export async function fetchOwnerDailyOverview(params = {}) {
  const query = buildQuery(params); // { date, venueId }
  const res = await apiFetch(`/owner/bookings/daily${query}`);
  return res.data || {};
}
