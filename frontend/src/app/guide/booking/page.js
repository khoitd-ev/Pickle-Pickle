import OwnerStaticShell, { Section } from "../../(static)/_components/OwnerStaticShell";

function Tip({ children }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
      {children}
    </div>
  );
}

export default function Page() {
  const sections = [
    "Bước 1: Tìm sân",
    "Bước 2: Chọn ngày & khung giờ",
    "Bước 3: Xác nhận thông tin",
    "Bước 4: Thanh toán (nếu có)",
    "Theo dõi & quản lý đặt sân",
  ];

  return (
    <OwnerStaticShell
      title="Hướng dẫn đặt sân"
      subtitle="Các bước đặt sân nhanh trên PicklePickle."
      sections={sections}
    >
      <Section title="Bước 1: Tìm sân">
        <p>
          Vào trang danh sách/tìm kiếm sân, chọn khu vực phù hợp. Bạn có thể xem nhanh thông tin sân
          trước khi vào chi tiết.
        </p>
        <Tip>
          Mẹo: Ưu tiên xem số lượng sân (courts) và giờ hoạt động để chọn sân phù hợp nhu cầu.
        </Tip>
      </Section>

      <Section title="Bước 2: Chọn ngày & khung giờ">
        <p>
          Trong trang chi tiết sân, chọn ngày muốn đặt và xem các khung giờ còn trống theo từng sân con (court).
        </p>
      </Section>

      <Section title="Bước 3: Xác nhận thông tin">
        <ul className="list-disc pl-5 space-y-1">
          <li>Kiểm tra đúng ngày/giờ/court.</li>
          <li>Kiểm tra giá (nếu sân có áp dụng).</li>
          <li>Nhập ghi chú (nếu cần), ví dụ: số người chơi, yêu cầu khác.</li>
        </ul>
      </Section>

      <Section title="Bước 4: Thanh toán (nếu có)">
        <p>
          Một số sân có thể yêu cầu thanh toán/đặt cọc. Hệ thống sẽ hiển thị rõ trước khi bạn xác nhận.
          Sau khi thanh toán thành công, trạng thái đặt sân sẽ được cập nhật.
        </p>
        <Tip>
          Nếu thanh toán xong nhưng đơn chưa cập nhật, hãy chờ vài phút rồi tải lại trang. Nếu vẫn lỗi,
          gửi mã đơn cho bộ phận hỗ trợ.
        </Tip>
      </Section>

      <Section title="Theo dõi & quản lý đặt sân">
        <p>
          Bạn có thể xem lịch sử và trạng thái đặt sân tại mục Lịch sử/Booking của tài khoản.
          Nếu cần huỷ/đổi lịch, hãy làm theo chính sách của sân và hướng dẫn trên màn hình.
        </p>
      </Section>
    </OwnerStaticShell>
  );
}
