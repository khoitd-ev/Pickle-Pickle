export default function BookingHistoryFilter({ sort, onChangeSort }) {
  return (
    <div className="flex justify-end mb-6">
      <div className="relative">
        {/* Nút xám hiển thị bên trên */}
        <div className="flex items-center justify-between min-w-[160px] px-3 py-1.5 rounded-md bg-[#a0a0a0] text-[12px] text-white">
          <span className="font-medium">Sắp xếp theo</span>
          <span className="ml-2 text-[10px]">▾</span>
        </div>

        {/* Select thật – trong suốt, dùng để xổ list */}
        <select
          value={sort}
          onChange={(e) => onChangeSort(e.target.value)}
          className=" absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[12px] text-black "
        >
          <option
            value="oldest"
            className="text-[12px] text-black"
          >
            Cũ nhất
          </option>
          <option
            value="newest"
            className="text-[12px] text-black"
          >
            Mới nhất
          </option>
        </select>
      </div>
    </div>
  );
}
