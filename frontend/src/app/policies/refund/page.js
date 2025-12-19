import OwnerStaticShell, { Section } from "../../(static)/_components/OwnerStaticShell";

export default function Page() {
  const sections = [
    "Nguyên tắc huỷ",
    "Điều kiện hoàn tiền",
    "Thời gian xử lý",
    "Trường hợp bất khả kháng",
    "Liên hệ hỗ trợ",
  ];

  return (
    <OwnerStaticShell
      title="Chính sách huỷ & hoàn tiền"
      subtitle="Chính sách chung. Một số sân có thể có quy định riêng và sẽ được hiển thị khi đặt sân."
      sections={sections}
    >
      <Section title="Nguyên tắc huỷ">
        <p>
          Bạn có thể huỷ đặt sân theo quy định của từng sân và theo trạng thái đơn. Hệ thống sẽ hiển thị
          các lựa chọn huỷ (nếu được phép).
        </p>
      </Section>

      <Section title="Điều kiện hoàn tiền">
        <ul className="list-disc pl-5 space-y-1">
          <li>Hoàn tiền có thể áp dụng nếu huỷ trước thời điểm quy định.</li>
          <li>Một số khoản phí có thể không hoàn lại tuỳ chính sách sân/đối tác thanh toán.</li>
          <li>Trường hợp sân huỷ do lỗi vận hành có thể được ưu tiên xử lý.</li>
        </ul>
      </Section>

      <Section title="Thời gian xử lý">
        <p>
          Thời gian hoàn tiền phụ thuộc phương thức thanh toán và quy trình đối tác. PicklePickle sẽ cập nhật
          tiến độ trên hệ thống khi có thay đổi.
        </p>
      </Section>

      <Section title="Trường hợp bất khả kháng">
        <p>
          Thời tiết cực đoan, sự cố điện/nước, hoặc yêu cầu từ cơ quan chức năng có thể ảnh hưởng lịch.
          Trong trường hợp này, bạn nên liên hệ sân để thống nhất phương án đổi lịch/hoàn tiền.
        </p>
      </Section>

      <Section title="Liên hệ hỗ trợ">
        <p>
          Khi cần hỗ trợ, vui lòng cung cấp mã đơn (booking id), sân, ngày/giờ đặt và mô tả vấn đề để đội hỗ trợ kiểm tra nhanh.
        </p>
      </Section>
    </OwnerStaticShell>
  );
}
