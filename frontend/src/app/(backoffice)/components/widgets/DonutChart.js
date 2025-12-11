"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * DonutChart widget dùng chung
 *
 * props:
 * - data: [{ name: string, value: number }, ...]
 * - colors: array màu, default: ["#7C5CFC", "#FF9BB2"]
 * - valueKey: key giá trị (default: "value")
 * - nameKey: key tên (default: "name")
 * - showCenterTotal: có hiển thị tổng ở giữa hay không (default: true)
 */
export default function DonutChartWidget({
  data,
  colors = ["#7C5CFC", "#FF9BB2"],
  valueKey = "value",
  nameKey = "name",
  showCenterTotal = true,
}) {
  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);

  return (
    <div className="w-full h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={entry[nameKey] ?? index}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>

          {showCenterTotal && (
            <foreignObject
              x="35%"
              y="35%"
              width="30%"
              height="30%"
              style={{ pointerEvents: "none" }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-xl font-semibold text-gray-900">
                  {total}
                </span>
              </div>
            </foreignObject>
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
