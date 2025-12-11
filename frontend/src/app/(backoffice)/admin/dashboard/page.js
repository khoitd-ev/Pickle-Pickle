"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/widgets/StatCard";
import BarChartWidget from "../../components/widgets/BarChart";
import DonutChartWidget from "../../components/widgets/DonutChart";
import LineChartWidget from "../../components/widgets/LineChart";
import TopCourtsBarChart from "../../components/widgets/TopCourtsBarChart";
import { apiFetch } from "../../../../lib/apiClient";

// ----------------- SMALL UI COMPONENTS -----------------

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
      onMouseDown={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}

// ----------------- MAIN COMPONENT -----------------

export default function AdminDashboardPage() {
  // Tab: doanh thu / lượt đặt sân
  const [activeTab, setActiveTab] = useState("revenue");
  // Thời gian cho line chart
  const [range, setRange] = useState("year");
  // Thời gian cho donut (khi không dùng custom range)
  const [bookingRange, setBookingRange] = useState("week");

  // Custom date range
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const usingCustomRange = customFrom && customTo;

  // Dropdown Chủ sân / Venue
  const [owners, setOwners] = useState([
    { id: "all", name: "Tất cả chủ sân", venues: [] },
  ]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [selectedOwnerId, setSelectedOwnerId] = useState("all");
  const [selectedVenueId, setSelectedVenueId] = useState("all");

  // Data state
  const [summary, setSummary] = useState({
    totalRevenueThisMonth: 0,
    growthPercent: 0,
    totalBookingsThisMonth: 0,
    activeCourtsPercent: 0,
    totalUsers: 0,
    newUsersThisWeek: 0,
  });

  const [revenueByMonth, setRevenueByMonth] = useState([]);
  const [bookingByTimeSlot, setBookingByTimeSlot] = useState([]);
  const [bookingStatusData, setBookingStatusData] = useState([]);
  const [topCourts, setTopCourts] = useState([]);

  const [loading, setLoading] = useState(true);

  // Current venues of selected owner
  const currentOwner =
    owners.find((o) => o.id === selectedOwnerId) || owners[0];
  const venueOptions =
    selectedOwnerId === "all" ? [] : currentOwner?.venues || [];

  // -------- Fetch owners for dropdown --------
  useEffect(() => {
    let mounted = true;

    async function loadOwners() {
      try {
        const res = await apiFetch("/admin/dashboard/owners");
        const payload = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
          ? res
          : [];

        if (!mounted) return;

        setOwners([
          { id: "all", name: "Tất cả chủ sân", venues: [] },
          ...payload.map((o) => ({
            id: o.id,
            name: o.name,
            venues: o.venues || [],
          })),
        ]);
      } catch (err) {
        console.error("Load owners failed:", err);
      } finally {
        if (mounted) setOwnersLoading(false);
      }
    }

    loadOwners();

    return () => {
      mounted = false;
    };
  }, []);

  // -------- Fetch dashboard data --------
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      try {
        // Build common query params for owner / venue / custom range
        const baseParams = new URLSearchParams();

        if (selectedOwnerId && selectedOwnerId !== "all") {
          baseParams.set("ownerId", selectedOwnerId);
        }
        if (
          selectedVenueId &&
          selectedVenueId !== "all" &&
          selectedOwnerId !== "all"
        ) {
          baseParams.set("venueId", selectedVenueId);
        }

        if (usingCustomRange) {
          baseParams.set("from", customFrom);
          baseParams.set("to", customTo);
        }

        // 1. Summary
        const summaryUrl =
          baseParams.toString().length > 0
            ? `/admin/dashboard/summary?${baseParams.toString()}`
            : "/admin/dashboard/summary";

        // 2. Revenue line chart
        const revenueParams = new URLSearchParams(baseParams.toString());
        if (!usingCustomRange) {
          revenueParams.set("range", range);
        }
        const revenueUrl =
          "/admin/dashboard/revenue" +
          (revenueParams.toString()
            ? `?${revenueParams.toString()}`
            : "");

        // 3. Booking status donut
        const statusParams = new URLSearchParams(baseParams.toString());
        if (!usingCustomRange) {
          statusParams.set("range", bookingRange);
        }
        const bookingStatusUrl =
          "/admin/dashboard/booking-status" +
          (statusParams.toString()
            ? `?${statusParams.toString()}`
            : "");

        // 4. Top courts
        const topCourtsUrl =
          baseParams.toString().length > 0
            ? `/admin/dashboard/top-courts?${baseParams.toString()}`
            : "/admin/dashboard/top-courts";

        // 5. Booking by time-slot bar chart
        const slotsParams = new URLSearchParams(baseParams.toString());
        if (!usingCustomRange) {
          slotsParams.set("range", "month");
        }
        const slotsUrl =
          "/admin/dashboard/bookings" +
          (slotsParams.toString() ? `?${slotsParams.toString()}` : "");

        const [
          summaryRes,
          revenueRes,
          bookingStatusRes,
          topCourtsRes,
          slotsRes,
        ] = await Promise.all([
          apiFetch(summaryUrl).catch(() => null),
          apiFetch(revenueUrl).catch(() => null),
          apiFetch(bookingStatusUrl).catch(() => null),
          apiFetch(topCourtsUrl).catch(() => null),
          apiFetch(slotsUrl).catch(() => null),
        ]);

        if (cancelled) return;

        // SUMMARY
        const summaryData =
          summaryRes?.data && typeof summaryRes.data === "object"
            ? summaryRes.data
            : typeof summaryRes === "object"
            ? summaryRes
            : null;

        if (summaryData) {
          setSummary((prev) => ({
            ...prev,
            ...summaryData,
          }));
        }

        // REVENUE LINE CHART
        const revPayload =
          revenueRes?.data && typeof revenueRes.data === "object"
            ? revenueRes.data
            : revenueRes;

        if (
          revPayload &&
          Array.isArray(revPayload.months) &&
          Array.isArray(revPayload.revenue)
        ) {
          const merged = revPayload.months.map((label, idx) => ({
            label,
            user: revPayload.activeUsers?.[idx] ?? 0,
            revenue: revPayload.revenue?.[idx] ?? 0,
          }));
          setRevenueByMonth(merged);
        } else {
          setRevenueByMonth([]);
        }

        // BOOKING STATUS (DONUT)
        const statusPayload =
          Array.isArray(bookingStatusRes?.data) ||
          Array.isArray(bookingStatusRes)
            ? bookingStatusRes?.data || bookingStatusRes
            : null;

        if (Array.isArray(statusPayload)) {
          setBookingStatusData(statusPayload);
        } else {
          setBookingStatusData([]);
        }

        // TOP COURTS
        const topCourtsPayload =
          Array.isArray(topCourtsRes?.data) || Array.isArray(topCourtsRes)
            ? topCourtsRes?.data || topCourtsRes
            : null;

        if (Array.isArray(topCourtsPayload)) {
          setTopCourts(topCourtsPayload);
        } else {
          setTopCourts([]);
        }

        // BOOKING BY TIMESLOT (BAR)
        const slotsPayload =
          Array.isArray(slotsRes?.data) || Array.isArray(slotsRes)
            ? slotsRes?.data || slotsRes
            : null;

        if (Array.isArray(slotsPayload)) {
          setBookingByTimeSlot(slotsPayload);
        } else {
          setBookingByTimeSlot([]);
        }
      } catch (err) {
        console.error("Admin dashboard load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [
    range,
    bookingRange,
    selectedOwnerId,
    selectedVenueId,
    customFrom,
    customTo,
    usingCustomRange,
  ]);

  // ---------- Derived values ----------

  const totalBookings =
    bookingStatusData?.reduce((sum, item) => sum + (item.value || 0), 0) || 0;

  const revenueNumber =
    summary.totalRevenueThisMonth ?? summary.todayRevenue ?? 0;

  const growthPercent =
    typeof summary.growthPercent === "number" ? summary.growthPercent : 0;

  const totalUsers = summary.totalUsers ?? 0;
  const newUsersThisWeek = summary.newUsersThisWeek ?? 0;

  const totalBookingsSummary =
    summary.totalBookingsThisMonth ?? summary.todayBookings ?? 0;

  const activePercent =
    typeof summary.activeCourtsPercent === "number"
      ? summary.activeCourtsPercent
      : 0;

  const topCourtsChartData = topCourts.map((c) => ({
    name: c.name,
    value:
      typeof c.revenue === "number"
        ? c.revenue
        : typeof c.bookings === "number"
        ? c.bookings
        : 0,
  }));

  if (loading && !ownersLoading) {
    return (
      <div className="p-6 text-gray-500 text-sm">
        Đang tải dữ liệu dashboard admin...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ========== 1. TOP STAT CARDS ========== */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Tổng doanh thu toàn hệ thống"
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
              <span
                className={`ml-1 ${
                  growthPercent >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {growthPercent >= 0 ? "▲" : "▼"}
              </span>
            </>
          }
          extra={
            summary.todayRevenue
              ? `Doanh thu hôm nay: ${summary.todayRevenue.toLocaleString(
                  "vi-VN"
                )} VND`
              : "Doanh thu hôm nay đang cập nhật"
          }
        />

        <StatCard
          title="Tổng người dùng"
          value={totalUsers.toLocaleString("vi-VN")}
          subtitle={
            <span className="text-gray-500 text-xs">
              Lượt sử dụng trong tuần:{" "}
              <span className="font-medium text-gray-800">
                {newUsersThisWeek.toLocaleString("vi-VN")}
              </span>
            </span>
          }
        />

        <StatCard
          title="Tổng lượt đặt sân"
          value={totalBookingsSummary.toLocaleString("vi-VN")}
          subtitle={
            <span className="text-gray-500 text-xs">
              Tổng lượt đặt sân trong tháng hiện tại
            </span>
          }
        />

        <StatCard
          title="Tỉ lệ sân đang hoạt động"
          value={`${activePercent.toFixed(0)}%`}
          extra={
            <div className="mt-2">
              <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(Math.max(activePercent, 0), 100)}%`,
                    background:
                      "linear-gradient(90deg, #00C9A7 0%, #4ADE80 100%)",
                  }}
                />
              </div>
            </div>
          }
        />
      </section>

      {/* ========== 2. LINE / BAR CHART + RANKING ========== */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {/* Header: Tabs + Filters */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
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
            {/* Chủ sân */}
            <select
              value={selectedOwnerId}
              onChange={(e) => {
                const newOwnerId = e.target.value;
                setSelectedOwnerId(newOwnerId);
                setSelectedVenueId("all");
              }}
              className="h-9 px-3 rounded-lg border border-gray-200 text-gray-700 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 min-w-[160px]"
            >
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.id === "all" ? "Tất cả chủ sân" : owner.name}
                </option>
              ))}
            </select>

            {/* Sân */}
            <select
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
              disabled={
                selectedOwnerId === "all" ||
                ownersLoading ||
                venueOptions.length === 0
              }
              className={`h-9 px-3 rounded-lg border text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 min-w-[180px] ${
                selectedOwnerId === "all" || venueOptions.length === 0
                  ? "border-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              {selectedOwnerId === "all" ? (
                <option>Chọn chủ sân để xem danh sách sân</option>
              ) : venueOptions.length === 0 ? (
                <option>Chủ sân này chưa có sân nào</option>
              ) : (
                <>
                  <option value="all">Tất cả sân của chủ này</option>
                  {venueOptions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Range chips */}
            <div className="flex items-center gap-2 ml-1">
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

            <div className="h-4 w-px bg-gray-200" />

            {/* Custom date range */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="h-9 px-3 rounded border border-gray-200 bg-white text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="h-9 px-3 rounded border border-gray-200 bg-white text-gray-700 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
              />
              {usingCustomRange && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="ml-1 text-[11px] text-gray-500 hover:text-sky-600"
                >
                  Xoá khoảng ngày
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Body: Chart + Ranking list */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* LEFT: chart */}
          <div className="xl:col-span-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {activeTab === "revenue"
                ? "Doanh thu & người dùng theo tháng"
                : "Lượt đặt sân theo khung giờ"}
            </h3>

            {activeTab === "revenue" ? (
              <LineChartWidget
                data={revenueByMonth}
                lines={[
                  { key: "revenue", name: "Revenue", color: "#F97373" },
                  { key: "user", name: "User", color: "#3B82F6" },
                ]}
              />
            ) : (
              <BarChartWidget
                data={bookingByTimeSlot}
                xKey="label"
                yKey="value"
                height={280}
              />
            )}
          </div>

          {/* RIGHT: ranking list */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Top Ranking Pickleball Court
            </h3>
            <ol className="space-y-2 text-xs">
              {topCourts.map((court, index) => (
                <li
                  key={court.name ?? index}
                  className="flex items-center justify-between py-1"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-red-50 text-red-500 text-[10px] flex items-center justify-center font-semibold">
                      {index + 1}
                    </span>
                    <span className="text-gray-800 text-sm">
                      {court.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <img
                        src="/search/starIcon.svg"
                        alt="rating"
                        className="w-3.5 h-3.5"
                      />
                      <span>
                        {court.rating != null
                          ? Number(court.rating).toFixed(1)
                          : ""}
                      </span>
                    </div>
                    {court.bookings != null && (
                      <span>{court.bookings} lượt</span>
                    )}
                  </div>
                </li>
              ))}
              {topCourts.length === 0 && (
                <li className="text-xs text-gray-400">
                  Chưa có dữ liệu sân để xếp hạng.
                </li>
              )}
            </ol>
          </div>
        </div>
      </section>

      {/* ========== 3. BOTTOM: TOP COURTS BAR + DONUT STATUS ========== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: top courts bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Top sân có lượt đặt cao nhất
          </h3>
          <TopCourtsBarChart data={topCourtsChartData} />
        </div>

        {/* RIGHT: donut booking status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">
              Trạng thái đặt sân
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <FilterChip
                active={!usingCustomRange && bookingRange === "week"}
                onClick={() => setBookingRange("week")}
              >
                Tuần
              </FilterChip>
              <FilterChip
                active={!usingCustomRange && bookingRange === "month"}
                onClick={() => setBookingRange("month")}
              >
                Tháng
              </FilterChip>
              <FilterChip
                active={!usingCustomRange && bookingRange === "year"}
                onClick={() => setBookingRange("year")}
              >
                Năm
              </FilterChip>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center">
            <DonutChartWidget data={bookingStatusData} />
          </div>

          <div className="mt-3 space-y-1 text-xs text-gray-600">
            {bookingStatusData.map((item, index) => {
              const colors = ["#7C5CFC", "#FF9BB2", "#34D399", "#FBBF24"];
              const total = totalBookings || 1;

              return (
                <div
                  key={item.name ?? index}
                  className="flex items-center gap-2"
                >
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: colors[index % colors.length],
                    }}
                  />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-gray-500">
                    {item.value} (
                    {((item.value / total) * 100).toFixed(2)}%)
                  </span>
                </div>
              );
            })}

            {bookingStatusData.length === 0 && (
              <div className="text-xs text-gray-400">
                Chưa có dữ liệu trạng thái đặt sân cho khoảng thời gian này.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
