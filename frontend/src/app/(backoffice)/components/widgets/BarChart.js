"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

/**
 * Generic BarChart widget dùng chung cho admin & owner
 *
 * props:
 * - data: [{ label: string, value: number }, ...]
 * - xKey: key dùng cho trục X (default: "label")
 * - yKey: key dùng cho trục Y (default: "value")
 * - height: chiều cao px (default: 280)
 */
export default function BarChartWidget({
  data,
  xKey = "label",
  yKey = "value",
  height = 280,
}) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart data={data} barSize={24}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />
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
          <Tooltip
            cursor={{ fill: "rgba(148,163,184,0.15)" }}
            contentStyle={{ fontSize: 12 }}
          />
          <Bar
            dataKey={yKey}
            radius={[6, 6, 0, 0]}
            fill="#7C5CFC"
            opacity={0.9}
          />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
