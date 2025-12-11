"use client";

import { useState, useEffect } from "react";
import StatCard from "../../components/widgets/StatCard";
import BarChartWidget from "../../components/widgets/BarChart";
import DonutChartWidget from "../../components/widgets/DonutChart";
import LineChartWidget from "../../components/widgets/LineChart";
import { apiFetch } from "../../../../lib/apiClient";

// ---------- Mock fallback ----------
const MOCK_BOOKING_BY_TIME_SLOT = [
  { label: "5-7", value: 20 },
  { label: "7-9", value: 28 },
  { label: "9-11", value: 25 },
  { label: "11-13", value: 10 },
  { label: "13-15", value: 6 },
  { label: "15-17", value: 12 },
  { label: "17-19", value: 45 },
  { label: "19-21", value: 35 },
  { label: "21-23", value: 20 },
];

const MOCK_REVENUE_BY_MONTH = [
  { label: "T1", user: 30, revenue: 25 },
  { label: "T2", user: 45, revenue: 35 },
  { label: "T3", user: 48, revenue: 40 },
  { label: "T4", user: 32, revenue: 28 },
  { label: "T5", user: 24, revenue: 30 },
  { label: "T6", user: 55, revenue: 50 },
  { label: "T7", user: 70, revenue: 68 },
  { label: "T8", user: 82, revenue: 80 },
  { label: "T9", user: 95, revenue: 92 },
  { label: "T10", user: 88, revenue: 86 },
  { label: "T11", user: 75, revenue: 73 },
  { label: "T12", user: 68, revenue: 66 },
];

const MOCK_BOOKING_STATUS = [
  { name: "Hoàn thành", value: 150 },
  { name: "Đã huỷ", value: 20 },
];

const MOCK_SUMMARY = {
  totalRevenueThisMonth: 80000000,
  growthPercent: 12,
  totalBookingsThisMonth: 6560,
  activeCourtsPercent: 78,
};

// Mini UI helpers
function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 text-sm border-b-2 transition-colors ${
        active
          ? "border-sky-500 text-sky-600 font-medium"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
        active
          ? "bg-sky-50 text-sky-600 border-sky-200"
          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------- MAIN PAGE ----------------
export default function OwnerDashboardPage() {
  const [activeTab, setActiveTab] = useState("revenue");
  const [range, setRange] = useState("year");

  // Custom date range
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const usingCustomRange = customFrom && customTo;

  // Venue dropdown
  const [venues, setVenues] = useState([{ id: "all", name: "Tất cả sân của tôi" }]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState("all");

  // Dashboard data
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [revenueByMonth, setRevenueByMonth] = useState(MOCK_REVENUE_BY_MONTH);
  const [bookingByTimeSlot, setBookingByTimeSlot] =
    useState(MOCK_BOOKING_BY_TIME_SLOT);
  const [bookingStatusData, setBookingStatusData] =
    useState(MOCK_BOOKING_STATUS);

  const [loading, setLoading] = useState(true);

  // --------- 1) LOAD DANH SÁCH SÂN (REUSE EXISTING API) ----------
  useEffect(() => {
    let mounted = true;

    async function loadVenues() {
      try {
        const res = await apiFetch("/owner/venues");
        const payload = Array.isArray(res?.data) ? res.data : [];

        if (!mounted) return;

        setVenues([
          { id: "all", name: "Tất cả sân của tôi" },
          ...payload.map((v) => ({
            id: v.id,
            name: v.name,
          })),
        ]);
      } catch (err) {
        console.error("Load owner venues failed:", err);
      } finally {
        if (mounted) setVenuesLoading(false);
      }
    }

    loadVenues();
    return () => (mounted = false);
  }, []);

  // --------- 2) LOAD DASHBOARD DATA (SUMMARY + CHARTS) ----------
  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        // venue filter
        if (selectedVenueId !== "all") {
          params.set("venueId", selectedVenueId);
        }

        // date range filter
        if (usingCustomRange) {
          params.set("from", customFrom);
          params.set("to", customTo);
        }

        // SUMMARY
        const summaryUrl = `/owner/dashboard/summary${
          params.toString() ? `?${params.toString()}` : ""
        }`;

        // REVENUE
        const revenueParams = new URLSearchParams(params.toString());
        if (!usingCustomRange) revenueParams.set("range", range);

        const revenueUrl = `/owner/dashboard/revenue${
          revenueParams.toString() ? `?${revenueParams.toString()}` : ""
        }`;

        // BOOKINGS (bar)
        const slotParams = new URLSearchParams(params.toString());
        if (!usingCustomRange) slotParams.set("range", "month");

        const slotsUrl = `/owner/dashboard/bookings${
          slotParams.toString() ? `?${slotParams.toString()}` : ""
        }`;

        // STATUS (donut)
        const statusParams = new URLSearchParams(params.toString());
        if (!usingCustomRange) statusParams.set("range", "month");

        const statusUrl = `/owner/dashboard/booking-status${
          statusParams.toString() ? `?${statusParams.toString()}` : ""
        }`;

        // EXECUTE ALL
        const [summaryRes, revenueRes, slotsRes, statusRes] =
          await Promise.all([
            apiFetch(summaryUrl).catch(() => null),
            apiFetch(revenueUrl).catch(() => null),
            apiFetch(slotsUrl).catch(() => null),
            apiFetch(statusUrl).catch(() => null),
          ]);

        // SUMMARY handling
        if (summaryRes?.data) {
          setSummary((prev) => ({ ...prev, ...summaryRes.data }));
        }

        // REVENUE handling
        const rev = revenueRes?.data;
        if (rev?.months) {
          setRevenueByMonth(
            rev.months.map((label, i) => ({
              label,
              user: rev.activeUsers?.[i] ?? 0,
              revenue: rev.revenue?.[i] ?? 0,
            }))
          );
        } else if (usingCustomRange) setRevenueByMonth([]);

        // BOOKINGS handling
        const slotData = slotsRes?.data;
        if (Array.isArray(slotData)) {
          setBookingByTimeSlot(slotData);
        } else if (usingCustomRange) setBookingByTimeSlot([]);

        // STATUS handling
        const statusData = statusRes?.data;
        if (Array.isArray(statusData)) {
          setBookingStatusData(statusData);
        } else if (usingCustomRange) setBookingStatusData([]);
      } catch (err) {
        console.error("Owner dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [
    range,
    customFrom,
    customTo,
    usingCustomRange,
    selectedVenueId,
  ]);

  const totalBookings = bookingStatusData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  const revenueNumber =
    summary.totalRevenueThisMonth ??
    summary.todayRevenue ??
    MOCK_SUMMARY.totalRevenueThisMonth;

  const growthPercent =
    typeof summary.growthPercent === "number"
      ? summary.growthPercent
      : MOCK_SUMMARY.growthPercent;

  const totalBookingsSummary =
    summary.totalBookingsThisMonth ??
    summary.todayBookings ??
    MOCK_SUMMARY.totalBookingsThisMonth;

  const activePercent = Math.round(summary.activeVenuePercent || 0);

  if (loading) {
    return (
      <div className="p-6 text-gray-500 text-sm">Đang tải dữ liệu dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ======= SUMMARY CARDS ======= */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={`${revenueNumber.toLocaleString("vi-VN")} VND`}
          subtitle={
            <>
              Tăng so với tháng trước{" "}
              <span
                className={`font-semibold ${
                  growthPercent >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {growthPercent.toFixed(2)}%
              </span>
            </>
          }
        />

        <StatCard
          title="Tổng lượt đặt sân"
          value={totalBookingsSummary.toLocaleString("vi-VN")}
          subtitle={<span className="text-gray-500 text-xs">Trong tháng này</span>}
        />

        <StatCard
          title="Số sân còn hoạt động"
          value={`${activePercent}%`}
          extra={
            <div className="mt-2">
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${activePercent}%`,
                    background:
                      "linear-gradient(90deg, #00C9A7 0%, #4ADE80 100%)",
                  }}
                />
              </div>
            </div>
          }
        />
      </section>

      {/* ======= CHART SECTION ======= */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100">
        {/* Tabs + Filters */}
        <div className="flex flex-col md:flex-row md:justify-between px-6 pt-4 gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-4">
            <TabButton
              active={activeTab === "revenue"}
              onClick={() => setActiveTab("revenue")}
            >
              Doanh thu
            </TabButton>

            <TabButton
              active={activeTab === "bookings"}
              onClick={() => setActiveTab("bookings")}
            >
              Lượt đặt sân
            </TabButton>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Dropdown sân */}
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              disabled={venuesLoading}
              className={`h-9 px-3 rounded-lg border text-xs bg-white min-w-[180px] ${
                venuesLoading
                  ? "border-gray-100 text-gray-400"
                  : "border-gray-200 text-gray-700 focus:outline-none focus:ring-1 focus:ring-sky-400"
              }`}
            >
              {venues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {/* Range chips */}
            <div className="flex items-center gap-2">
              <FilterChip
                active={!usingCustomRange && range === "week"}
                onClick={() => setRange("week")}
              >
                Tuần
              </FilterChip>

              <FilterChip
                active={!usingCustomRange && range === "month"}
                onClick={() => setRange("month")}
              >
                Tháng
              </FilterChip>

              <FilterChip
                active={!usingCustomRange && range === "year"}
                onClick={() => setRange("year")}
              >
                Năm
              </FilterChip>
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 px-3 rounded border border-gray-200 text-xs"
              />

              <span className="text-gray-400">–</span>

              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 px-3 rounded border border-gray-200 text-xs"
              />

              {usingCustomRange && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="text-[11px] text-gray-500 hover:text-sky-600"
                >
                  Xoá
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 p-6">
          {/* Main Chart */}
          <div className="xl:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {activeTab === "bookings"
                ? "Lượt đặt sân theo khung giờ"
                : "Doanh thu theo tháng"}
            </h3>

            {activeTab === "bookings" ? (
              <BarChartWidget data={bookingByTimeSlot} />
            ) : (
              <LineChartWidget data={revenueByMonth} />
            )}
          </div>

          {/* Donut Chart */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Tình trạng đặt sân
            </h3>

            <DonutChartWidget data={bookingStatusData} />

            <div className="mt-3 space-y-1 text-xs text-gray-600">
              {bookingStatusData.map((item, i) => {
                const colors = ["#7C5CFC", "#FF9BB2"];
                const total = totalBookings || 1;

                return (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colors[i % colors.length] }}
                    />
                    <span className="flex-1">{item.name}</span>
                    <span className="text-gray-500">
                      {item.value} ({((item.value / total) * 100).toFixed(2)}%)
                    </span>
                  </div>
                );
              })}

              {bookingStatusData.length === 0 && (
                <div className="text-gray-400">Không có dữ liệu.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
