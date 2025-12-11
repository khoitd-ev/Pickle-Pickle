"use client";

import Image from "next/image";

export default function SearchFiltersBar({
  filters,
  onChangeFilters,
  onApplyFilters,
  onChangeAreaLive,
  stats,
  loading,
}) {
  const { keyword, date, startTime, endTime, area } = filters;
  const totalCourts = stats?.totalCourts ?? 0;
  const totalAreas = stats?.totalAreas ?? 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onApplyFilters) onApplyFilters();
  };

  const update = (patch) => onChangeFilters(patch);

  return (
    <div>
      {/* SEARCH BAR CONTAINER */}
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 md:flex-row md:items-center">
          {/* Tên sân */}
          <div className="flex flex-1 items-center gap-2 border-b border-zinc-200 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <Image
              src="/search/searchIcon.svg"
              alt="Search"
              width={18}
              height={18}
            />
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400">Tên sân</p>
              <input
                type="text"
                placeholder="PicklePickle"
                value={keyword}
                onChange={(e) => update({ keyword: e.target.value })}
                className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none placeholder:text-zinc-400"
              />
            </div>
            <button
              type="button"
              className="text-xs text-zinc-500 hover:text-zinc-700"
              onClick={() => update({ keyword: "" })}
            >
              ×
            </button>
          </div>

          {/* Ngày */}
          <div className="flex flex-1 items-center gap-2 border-b border-zinc-200 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <Image
              src="/search/calendarIcon.svg"
              alt="Calendar"
              width={18}
              height={18}
            />
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400">Ngày</p>
              <input
                type="date"
                value={date}
                onChange={(e) => update({ date: e.target.value })}
                className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none"
              />
            </div>
          </div>

          {/* Bắt đầu */}
          <div className="flex flex-1 items-center gap-2 border-b border-zinc-200 pb-2 md:border-b-0 md:border-r md:pb-0 md:pr-4">
            <Image
              src="/search/clockstartIcon.svg"
              alt="Start time"
              width={18}
              height={18}
            />
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400">Bắt đầu</p>
              <input
                type="time"
                value={startTime}
                onChange={(e) => update({ startTime: e.target.value })}
                className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none"
              />
            </div>
          </div>

          {/* Kết thúc */}
          <div className="flex flex-1 items-center gap-2 md:pr-4">
            <Image
              src="/search/clockendIcon.svg"
              alt="End time"
              width={18}
              height={18}
            />
            <div className="flex-1">
              <p className="text-[11px] text-zinc-400">Kết thúc</p>
              <input
                type="time"
                value={endTime}
                onChange={(e) => update({ endTime: e.target.value })}
                className="w-full border-0 bg-transparent text-sm font-medium text-zinc-900 outline-none"
              />
            </div>
          </div>

          {/* Nút Search */}
          <div className="flex justify-end md:pl-2">
            <button
              type="submit"
              className="h-[44px] min-w-[120px] rounded-xl bg-zinc-800 px-6 text-sm font-semibold text-white shadow-md transition-all duration-150 hover:bg-zinc-900 hover:shadow-lg hover:scale-[1.02]"
              disabled={loading}
            >
              {loading ? "Đang tìm..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {/* HÀNG DƯỚI: Khu vực + summary */}
      <div className="mt-3 flex flex-col gap-2 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between">
        <select
          value={area}
          onChange={(e) => {
            const value = e.target.value;
            if (onChangeAreaLive) {
              //  cập nhật cả draft lẫn filters & gọi API
              onChangeAreaLive(value);
            } else {
              // fallback nếu sau này dùng component ở chỗ khác
              update({ area: value });
            }
          }}
          className="w-full md:w-[15%] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 shadow-sm outline-none hover:border-zinc-300"
        >
          <option value="">Khu vực</option>
          {/* ... list quận huyện giữ nguyên ... */}
          <option value="q1">Quận 1</option>
          <option value="q3">Quận 3</option>
          <option value="q4">Quận 4</option>
          <option value="q5">Quận 5</option>
          <option value="q6">Quận 6</option>
          <option value="q7">Quận 7</option>
          <option value="q8">Quận 8</option>
          <option value="q10">Quận 10</option>
          <option value="q11">Quận 11</option>
          <option value="q12">Quận 12</option>
          <option value="binhtan">Quận Bình Tân</option>
          <option value="binhthanh">Quận Bình Thạnh</option>
          <option value="govap">Quận Gò Vấp</option>
          <option value="phunhuan">Quận Phú Nhuận</option>
          <option value="tanbinh">Quận Tân Bình</option>
          <option value="tanphu">Quận Tân Phú</option>
          <option value="thuduc">TP Thủ Đức</option>
          <option value="binhchanh">Huyện Bình Chánh</option>
          <option value="cangio">Huyện Cần Giờ</option>
          <option value="cuchi">Huyện Củ Chi</option>
          <option value="hocmon">Huyện Hóc Môn</option>
          <option value="nhabe">Huyện Nhà Bè</option>
        </select>

        <p className="text-[11px] md:text-xs">
          {totalCourts} sân từ {totalAreas} khu vực
        </p>
      </div>
    </div>
  );
}
