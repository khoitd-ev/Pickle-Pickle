"use client";

import { useEffect, useState } from "react";
import StatCard from "../../components/widgets/StatCard";
import { apiFetch } from "../../../../lib/apiClient";
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

const MOCK_SUMMARY = {
  totalRevenue: 80000000,
  weekRevenue: 30000000,
  monthRevenue: 50000000,
};

const MOCK_REVENUE_BY_MONTH = [
  { month: "T1", newUsers: 70, revenue: 30 },
  { month: "T2", newUsers: 110, revenue: 50 },
  { month: "T3", newUsers: 130, revenue: 120 },
  { month: "T4", newUsers: 120, revenue: 110 },
  { month: "T5", newUsers: 100, revenue: 120 },
  { month: "T6", newUsers: 115, revenue: 110 },
  { month: "T7", newUsers: 50, revenue: 60 },
  { month: "T8", newUsers: 60, revenue: 70 },
  { month: "T9", newUsers: 80, revenue: 140 },
  { month: "T10", newUsers: 20, revenue: 90 },
  { month: "T11", newUsers: 35, revenue: 50 },
  { month: "T12", newUsers: 55, revenue: 60 },
];

export default function OwnerRevenueOverviewPage() {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [chartData, setChartData] = useState(MOCK_REVENUE_BY_MONTH);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRevenueReport() {
      setLoading(true);
      try {
        const res = await apiFetch(
          "/owner/reports/revenue?range=year"
        ).catch(() => null);

        if (res) {
          const payload = res.data || res;

          if (payload.summary && typeof payload.summary === "object") {
            setSummary((prev) => ({
              ...prev,
              ...payload.summary,
            }));
          }

          if (payload.chart && Array.isArray(payload.chart.months)) {
            const merged = payload.chart.months.map((label, i) => ({
              month: label,
              newUsers: payload.chart.activeUsers?.[i] ?? 0,
              revenue: payload.chart.revenue?.[i] ?? 0,
            }));
            setChartData(merged);
          } else if (Array.isArray(payload.chartData)) {
            setChartData(payload.chartData);
          }
        }
      } catch (err) {
        console.error("Owner revenue report load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRevenueReport();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tổng quan doanh thu
        </h1>
        <p className="text-sm text-gray-500">
          Thống kê doanh thu theo tháng, hỗ trợ theo dõi hiệu quả kinh doanh của
          sân.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={`${summary.totalRevenue.toLocaleString("vi-VN")} VND`}
          extra="Tổng doanh thu từ trước đến nay"
        />
        <StatCard
          title="Doanh thu tuần"
          value={`${summary.weekRevenue.toLocaleString("vi-VN")} VND`}
          extra="Tổng doanh thu trong 7 ngày gần nhất"
        />
        <StatCard
          title="Doanh thu tháng"
          value={`${summary.monthRevenue.toLocaleString("vi-VN")} VND`}
          extra="Tổng doanh thu trong tháng hiện tại"
        />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
      </section>
    </div>
  );
}
