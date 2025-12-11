"use client";

import { useEffect, useState } from "react";
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
  fetchAdminDashboardSummary,
  fetchAdminBookingStats,
} from "../../../../../lib/dashboardApi";

const MOCK_SUMMARY = {
  totalUsers: 10000,
  usageRate: 50, // %
};

const MOCK_CHART = [
  { label: "5-7", value: 20 },
  { label: "7-9", value: 26 },
  { label: "9-11", value: 24 },
  { label: "11-13", value: 10 },
  { label: "13-15", value: 5 },
  { label: "15-17", value: 0 },
  { label: "17-19", value: 45 },
  { label: "19-21", value: 38 },
  { label: "21-23", value: 20 },
];

export default function AdminCustomersReportPage() {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [chartData, setChartData] = useState(MOCK_CHART);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Lấy summary + booking stats song song
        const [summaryRes, bookingRes] = await Promise.all([
          fetchAdminDashboardSummary({}),        // /admin/dashboard/summary
          fetchAdminBookingStats({ range: "month" }), // /admin/dashboard/bookings
        ]);

        // ===== Summary khách hàng =====
        if (summaryRes) {
          const totalUsers =
            typeof summaryRes.totalUsers === "number"
              ? summaryRes.totalUsers
              : MOCK_SUMMARY.totalUsers;

          const newUsersThisWeek =
            typeof summaryRes.newUsersThisWeek === "number"
              ? summaryRes.newUsersThisWeek
              : 0;

          const usageRate =
            totalUsers > 0
              ? (newUsersThisWeek / totalUsers) * 100
              : MOCK_SUMMARY.usageRate;

          setSummary({
            totalUsers,
            usageRate: Number(usageRate.toFixed(1)),
          });
        }

        // ===== Biểu đồ hoạt động khách hàng (tái dùng booking stats theo khung giờ) =====
        if (Array.isArray(bookingRes) && bookingRes.length) {
          const mapped = bookingRes.map((c) => {
            const rawLabel = c.label ?? c.slot ?? "";
            let label = rawLabel;

            // Convert "05-07" -> "5-7" cho giống mock
            if (typeof rawLabel === "string" && rawLabel.includes("-")) {
              const [s, e] = rawLabel.split("-");
              const sInt = parseInt(s, 10);
              const eInt = parseInt(e, 10);
              if (!Number.isNaN(sInt) && !Number.isNaN(eInt)) {
                label = `${sInt}-${eInt}`;
              }
            }

            return {
              label,
              value: c.value ?? c.count ?? 0,
            };
          });

          setChartData(mapped);
        }
      } catch (err) {
        console.error("Admin customers report load error:", err);
        // Nếu lỗi thì giữ nguyên mock
        setSummary(MOCK_SUMMARY);
        setChartData(MOCK_CHART);
      } finally {
        setLoading(false);
      }
    }

    // nếu backend chưa làm đủ API thì vẫn hiển thị mock
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tổng quan khách hàng
        </h1>
        <p className="text-sm text-gray-500">
          Thống kê số lượng người dùng và tỉ lệ sử dụng hệ thống.
        </p>
      </header>

      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="Tổng users trong hệ thống"
            value={summary.totalUsers.toLocaleString("vi-VN")}
            extra="Bao gồm cả khách đặt sân và chủ sân"
          />
          <StatCard
            title="Tỉ lệ sử dụng"
            value={`${summary.usageRate}%`}
            extra="Tỉ lệ người dùng hoạt động trong kỳ thống kê (ước tính từ user mới trong tuần)"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Hoạt động của khách hàng
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Số lượt đặt sân theo từng khung giờ.
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
                    dataKey="label"
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
                  <Bar
                    dataKey="value"
                    name="Lượt hoạt động"
                    radius={[6, 6, 0, 0]}
                    fill="#818CF8"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
