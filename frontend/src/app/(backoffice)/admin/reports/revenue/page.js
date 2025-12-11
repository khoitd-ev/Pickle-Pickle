"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import StatCard from "../../../components/widgets/StatCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

import {
  fetchAdminBookingStats,
  fetchAdminRevenueStats,
  fetchAdminTopCourts,
  fetchAdminDashboardSummary, // <-- THÊM
} from "../../../../../lib/dashboardApi";

export default function AdminBookingReportPage() {
  const [summary, setSummary] = useState({
    totalWebBookings: 0,
    peakSlot: "--",
    monthRevenue: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [dateRangeLabel] = useState("07/10/2025 - 20/10/2025");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Gọi song song: histogram khung giờ + doanh thu tháng + top courts + summary
        const [bookingRes, revenueRes, topCourts, summaryRes] =
          await Promise.all([
            fetchAdminBookingStats({ range: "month" }),
            fetchAdminRevenueStats({ range: "month" }),
            fetchAdminTopCourts({}),
            fetchAdminDashboardSummary({}), // <-- lấy tổng booking
          ]);

        // --- 1) Histogram theo khung giờ (slot) ---
        const slots =
          Array.isArray(bookingRes) && bookingRes.length
            ? bookingRes.map((s) => ({
                slot: s.label ?? s.slot,
                bookings: s.value ?? s.bookings ?? 0,
              }))
            : [];

        setChartData(slots);

        // --- 2) Tổng lượt đặt (đếm theo Booking, không theo Slot) ---
        const totalWebBookings =
          summaryRes?.totalBookingsThisMonth != null
            ? summaryRes.totalBookingsThisMonth
            : 0;

        // --- 3) Khung giờ cao điểm (vẫn dựa trên histogram slot) ---
        let peakSlot = "--";
        if (slots.length) {
          const top = slots.reduce(
            (max, cur) => (cur.bookings > max.bookings ? cur : max),
            slots[0]
          );
          peakSlot = `${top.slot} H`;
        }

        // --- 4) Doanh thu tháng (giữ nguyên cách tính cũ) ---
        const monthRevenue = Array.isArray(revenueRes?.revenue)
          ? revenueRes.revenue.reduce((sum, r) => sum + (r || 0), 0)
          : 0;

        setSummary({
          totalWebBookings,
          peakSlot,
          monthRevenue,
        });

        // --- 5) Bảng trạng thái sân: dùng top courts ---
        if (Array.isArray(topCourts)) {
          const mappedVenues = topCourts.map((c, idx) => ({
            id: idx + 1,
            name: c.name,
            totalBookings: c.bookings ?? 0, // đếm booking
            activeTime: "5h-22h", // tạm thời mock
            status: "Active", // tạm thời mock
          }));
          setVenues(mappedVenues);
        }
      } catch (err) {
        console.error("Admin booking report load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const statusDotClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500";
      case "Inactive":
        return "bg-yellow-400";
      case "Close":
        return "bg-red-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Thống kê đặt sân
        </h1>
        <p className="text-sm text-gray-500">
          Theo dõi tổng lượt đặt, khung giờ cao điểm và trạng thái hoạt động
          của từng sân.
        </p>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tổng lượt đặt sân qua web"
            // giờ sẽ là số booking, không phải tổng slot
            value={`${summary.totalWebBookings.toLocaleString("vi-VN")} LƯỢT`}
            extra="Tổng số lượt đặt sân trong kỳ thống kê"
          />
          <StatCard
            title="Khung giờ cao điểm"
            value={summary.peakSlot}
            extra="Khung giờ có số lượt đặt nhiều nhất"
          />
          <StatCard
            title="Doanh thu tháng"
            value={`${summary.monthRevenue.toLocaleString("vi-VN")} VND`}
            extra="Tổng doanh thu từ các lượt đặt trong tháng"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Tổng quan đặt sân
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Số lượt đặt sân theo từng khung giờ trong ngày.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={10}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="slot"
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={{ stroke: "#E5E7EB" }}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148,163,184,0.1)" }}
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} lượt`, "Lượt đặt sân"]}
                    labelFormatter={(label) => `Khung giờ ${label}`}
                  />
                  <Bar
                    dataKey="bookings"
                    name="Lượt đặt sân"
                    radius={[6, 6, 0, 0]}
                    fill="#818CF8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* TABLE */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-gray-900">
              Bảng chi tiết lượt đặt sân
            </h2>
            <p className="text-xs text-gray-500">
              Trạng thái:{" "}
              <span className="font-medium text-gray-700">
                {dateRangeLabel}
              </span>
            </p>
          </div>

          {/* SEARCH BAR */}
          <div className="relative w-52">
            <Image
              src="/searchIcon1.svg"
              alt="Search"
              width={16}
              height={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 opacity-60"
            />
            <input
              type="text"
              placeholder="Tìm kiếm sân"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-gray-200 pl-9 pr-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-t border-gray-100">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">
                  STT
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">
                  Tên sân
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">
                  Tổng lượt đặt
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">
                  Thời gian hoạt động
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-500">
                  Trạng thái
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVenues.map((v, idx) => (
                <tr
                  key={v.id}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                >
                  <td className="px-3 py-2 text-gray-700">{idx + 1}</td>
                  <td className="px-3 py-2 text-sky-600 hover:underline cursor-pointer">
                    {v.name}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {v.totalBookings.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{v.activeTime}</td>
                  <td className="px-3 py-2 text-gray-700">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${statusDotClass(
                          v.status
                        )}`}
                      />
                      {v.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-xs">
                    <button className="text-sky-600 hover:underline mr-2">
                      Edit
                    </button>
                    <button className="text-red-500 hover:underline">
                      Close
                    </button>
                  </td>
                </tr>
              ))}

              {!filteredVenues.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    Không có sân nào phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
