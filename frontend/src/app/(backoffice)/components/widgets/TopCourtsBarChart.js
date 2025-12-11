"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

export default function TopCourtsBarChart({ data = [] }) {
  // chuẩn hóa data
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value,
  }));

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, bottom: 10, left: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={70} />
          <Tooltip
            cursor={{ fill: "#f5f5f5" }}
            formatter={(v) => [`${v}`, "Lượt đặt / Doanh thu"]}
          />

          <Bar
            dataKey="value"
            fill="#A78BFA" // màu giống mockup
            radius={[0, 6, 6, 0]}
          >
            <LabelList
              dataKey="value"
              position="right"
              offset={10}
              fill="#4B5563"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
