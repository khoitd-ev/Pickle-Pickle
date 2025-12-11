"use client";

export default function StatCard({
  title,
  value,
  subtitle,
  extra,
  align = "left",
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-6 py-4 flex flex-col justify-between">
      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {title}
      </div>

      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>

      {subtitle && (
        <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
          {subtitle}
        </div>
      )}

      {extra && (
        <div
          className={`mt-3 text-xs text-gray-500 ${
            align === "right" ? "text-right" : ""
          }`}
        >
          {extra}
        </div>
      )}
    </div>
  );
}
