"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/widgets/StatCard";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import {
  fetchAdminDashboardSummary,
  fetchAdminRevenueStats,
  fetchAdminTopCourts,
} from "../../../../lib/dashboardApi";

// Fallback khi chưa có dữ liệu
const INITIAL_SUMMARY = {
  totalRevenue: 0,
  weekRevenue: 0,
  monthRevenue: 0,
};

export default function AdminRevenueReportPage() {
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [chartData, setChartData] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [dateRangeLabel] = useState("07/10/2025 - 20/10/2025");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Gọi song song: summary + line chart + top courts
        const [summaryRes, revenueRes, topCourts] = await Promise.all([
          fetchAdminDashboardSummary({}),
          fetchAdminRevenueStats({ range: "year" }),
          fetchAdminTopCourts({}),
        ]);

        // Map summary: hiện backend mới có totalRevenueThisMonth,
        // các field khác nếu anh bổ sung sau thì FE tự nhận.
        const mappedSummary = {
          totalRevenue: summaryRes?.totalRevenueThisMonth ?? 0,
          weekRevenue: summaryRes?.weekRevenue ?? 0, // tạm 0 nếu backend chưa trả
          monthRevenue: summaryRes?.totalRevenueThisMonth ?? 0,
        };
        setSummary(mappedSummary);

        // Line chart: { months, revenue, activeUsers }
        if (revenueRes && Array.isArray(revenueRes.months)) {
          const merged = revenueRes.months.map((m, idx) => ({
            month: m,
            newUsers: revenueRes.activeUsers?.[idx] ?? 0,
            revenue: revenueRes.revenue?.[idx] ?? 0,
          }));
          setChartData(merged);
        }

        // Bảng doanh thu theo sân: dùng top courts
        if (Array.isArray(topCourts)) {
          const mappedVenues = topCourts.map((c, idx) => {
            const totalRevenue = c.revenue ?? 0;
            const commissionRate = 10; // tạm fix 10%
            const commissionAmount = Math.round(
              (totalRevenue * commissionRate) / 100
            );

            return {
              id: idx + 1,
              name: c.name,
              totalBookings: c.bookings ?? 0,
              totalRevenue,
              commissionRate,
              commissionAmount,
              cancelRate: 0, // chưa có dữ liệu huỷ sân
            };
          });

          setVenues(mappedVenues);
        }
      } catch (err) {
        console.error("Admin revenue report load error:", err);
        // giữ nguyên state hiện tại (0 hoặc mock)
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredVenues = venues.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tổng quan doanh thu
        </h1>
        <p className="text-sm text-gray-500">
          Thống kê doanh thu hệ thống và chi tiết theo từng sân.
        </p>
      </header>

      {/* TOP CARDS + CHART */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tổng doanh thu"
            value={`${summary.totalRevenue.toLocaleString("vi-VN")} VND`}
            extra="Tổng doanh thu (tháng hiện tại)"
          />
          <StatCard
            title="Doanh thu tuần"
            value={`${summary.weekRevenue.toLocaleString("vi-VN")} VND`}
            extra="7 ngày gần nhất"
          />
          <StatCard
            title="Doanh thu tháng"
            value={`${summary.monthRevenue.toLocaleString("vi-VN")} VND`}
            extra="Tháng hiện tại"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Thống kê doanh thu
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                So sánh số người dùng mới và doanh thu theo từng tháng.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Đang tải dữ liệu...</div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barGap={8}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="month"
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
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12 }}
                    iconType="circle"
                    verticalAlign="top"
                    align="right"
                  />
                  <Bar
                    dataKey="newUsers"
                    name="Người dùng mới"
                    radius={[4, 4, 0, 0]}
                    fill="#818CF8"
                  />
                  <Bar
                    dataKey="revenue"
                    name="Doanh thu"
                    radius={[4, 4, 0, 0]}
                    fill="#F97373"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* TABLE SECTION */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-semibold text-gray-900">
              Bảng chi tiết doanh thu từng sân
            </h2>
            <p className="text-xs text-gray-500">
              Trạng thái:{" "}
              <span className="font-medium text-gray-700">
                {dateRangeLabel}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Tìm kiếm sân"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-md border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
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
                <th className="px-3 py-2 text-right font-semibold text-gray-500">
                  Tổng doanh thu
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">
                  Tỉ lệ hoa hồng
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">
                  Tiền hoa hồng
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-500">
                  Tỉ lệ huỷ sân
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
                  <td className="px-3 py-2 text-right text-gray-700">
                    {v.totalRevenue.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {v.commissionRate}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {v.commissionAmount.toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {v.cancelRate}%
                  </td>
                </tr>
              ))}

              {!filteredVenues.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center text-sm text-gray-500"
                  >
                    Không có sân nào phù hợp với từ khóa tìm kiếm.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* pagination mock đơn giản */}
        <div className="flex items-center justify-end gap-1 mt-4 text-xs text-gray-500">
          <button className="px-2 py-1 rounded border border-gray-200">
            1
          </button>
          <button className="px-2 py-1 rounded border border-gray-200">
            2
          </button>
          <button className="px-2 py-1 rounded border border-gray-200">
            3
          </button>
          <button className="px-2 py-1 rounded border border-gray-200">
            &gt;
          </button>
        </div>
      </section>
    </div>
  );
}
