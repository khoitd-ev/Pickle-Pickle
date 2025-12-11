"use client";

import { useEffect, useState } from "react";
import StatCard from "../../../components/widgets/StatCard";
import { apiFetch } from "../../../../../lib/apiClient";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const MOCK_SUMMARY = {
  totalWebBookings: 1000,
  peakSlot: "5-7 H",
  monthRevenue: 50000000,
};

const MOCK_SLOTS = [
  { slot: "5-7", bookings: 20 },
  { slot: "7-9", bookings: 25 },
  { slot: "9-11", bookings: 23 },
  { slot: "11-13", bookings: 10 },
  { slot: "13-15", bookings: 5 },
  { slot: "15-17", bookings: 2 },
  { slot: "17-19", bookings: 45 },
  { slot: "19-21", bookings: 38 },
  { slot: "21-23", bookings: 20 },
];

export default function OwnerBookingStatsPage() {
  const [summary, setSummary] = useState(MOCK_SUMMARY);
  const [chartData, setChartData] = useState(MOCK_SLOTS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await apiFetch(
          "/owner/reports/bookings?range=month"
        ).catch(() => null);

        if (res) {
          const payload = res.data || res;

          if (payload.summary) {
            setSummary((prev) => ({ ...prev, ...payload.summary }));
          }

          if (Array.isArray(payload.chartData)) {
            setChartData(payload.chartData);
          }
        }
      } catch (err) {
        console.error("Owner booking stats load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Thống kê đặt sân
        </h1>
        <p className="text-sm text-gray-500">
          Tổng quan lượt đặt sân theo khung giờ, giúp bạn tối ưu giờ mở cửa và
          giá.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Tổng lượt đặt sân qua web"
          value={`${summary.totalWebBookings.toLocaleString("vi-VN")} LƯỢT`}
          extra="Tổng số lượt đặt sân trong kỳ thống kê"
        />
        <StatCard
          title="Khung giờ cao điểm"
          value={summary.peakSlot ? `${summary.peakSlot} H` : "--"}
          extra="Khung giờ có số lượt đặt sân nhiều nhất"
        />
        <StatCard
          title="Doanh thu tháng"
          value={`${summary.monthRevenue.toLocaleString("vi-VN")} VND`}
          extra="Tổng doanh thu từ các lượt đặt trong tháng"
        />
      </section>

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
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
      </section>
    </div>
  );
}
