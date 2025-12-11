"use client";

import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

/**
 * LineChart widget dùng chung cho admin & owner
 *
 * props:
 * - data: [{ label: string, ... }]
 * - xKey: key dùng cho trục X (default: "label")
 * - lines: array các line, ví dụ:
 *   [
 *     { key: "user", name: "User", color: "#6366F1" },
 *     { key: "revenue", name: "Revenue", color: "#FB7185" }
 *   ]
 * - height: chiều cao px (default: 280)
 */
export default function LineChartWidget({
  data,
  xKey = "label",
  lines = [
    { key: "user", name: "User", color: "#6366F1" }, // tím nhạt
    { key: "revenue", name: "Revenue", color: "#FB7185" }, // hồng
  ],
  height = 280,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReLineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tick={{ fontSize: 11, fill: "#6B7280" }}
          />
          <YAxis
            tickLine={false}
            axisLine={{ stroke: "#E5E7EB" }}
            tick={{ fontSize: 11, fill: "#6B7280" }}
          />
          <Tooltip contentStyle={{ fontSize: 12 }} />
          <Legend
            verticalAlign="bottom"
            height={24}
            iconType="circle"
            formatter={(value) => (
              <span className="text-xs text-gray-600">{value}</span>
            )}
          />

          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </ReLineChart>
      </ResponsiveContainer>
    </div>
  );
}
