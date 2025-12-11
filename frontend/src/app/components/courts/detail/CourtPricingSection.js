"use client";

export default function CourtPricingSection({ pricing }) {
  const defaultPricing = {
    title: "Bảng giá sân PickoLand",
    rows: [
      {
        day: "T2 - T6",
        slots: [
          { time: "9h - 16h", fixed: "80.000đ/h", walkin: "90.000đ/h" },
        ],
      },
      {
        day: "T2 - CN",
        slots: [
          { time: "5h - 9h", fixed: "100.000đ/h", walkin: "110.000đ/h" },
          { time: "16h - 23h", fixed: "100.000đ/h", walkin: "110.000đ/h" },
        ],
      },
      {
        day: "T7 - CN",
        slots: [
          { time: "9h - 16h", fixed: "100.000đ/h", walkin: "110.000đ/h" },
        ],
      },
    ],
  };

  const data = pricing ?? defaultPricing;

  return (
    
    <section className="mt-6 border-t border-dashed border-zinc-200 pt-8">
      {/* Heading */}
      <h2 className="text-center text-2xl md:text-3xl font-semibold text-[#111946]">
        {data.title}
      </h2>

      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-3xl">
          {/* Bảng với góc bo tròn, KHÔNG còn khung xanh ngoài */}
          <div className="overflow-hidden rounded-2xl border border-[#23603b] bg-white">
            <table className="w-full border-collapse text-sm text-zinc-900">
              <thead>
                <tr className="bg-white">
                  <th className="border-b border-[#23603b] px-6 py-3 text-center font-semibold">
                    Thứ
                  </th>
                  <th className="border-b border-l border-[#23603b] px-6 py-3 text-center font-semibold">
                    Khung giờ
                  </th>
                  <th className="border-b border-l border-[#23603b] px-6 py-3 text-center font-semibold">
                    Cố định
                  </th>
                  <th className="border-b border-l border-[#23603b] px-6 py-3 text-center font-semibold">
                    Vãng lai
                  </th>
                </tr>
              </thead>

              <tbody>
                {data.rows.map((row) => {
                  const rowSpan = row.slots.length;

                  return row.slots.map((slot, slotIndex) => (
                    <tr key={`${row.day}-${slot.time}`}>
                      {slotIndex === 0 && (
                        <td
                          rowSpan={rowSpan}
                          className="border-t border-[#23603b] px-6 py-4 text-center align-middle"
                        >
                          {row.day}
                        </td>
                      )}

                      <td className="border-t border-l border-[#23603b] px-6 py-4 text-center">
                        {slot.time}
                      </td>
                      <td className="border-t border-l border-[#23603b] px-6 py-4 text-center">
                        {slot.fixed}
                      </td>
                      <td className="border-t border-l border-[#23603b] px-6 py-4 text-center">
                        {slot.walkin}
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
