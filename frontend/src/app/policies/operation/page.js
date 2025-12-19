import OwnerStaticShell, { Section } from "../../../(static)/_components/OwnerStaticShell";

export default function Page() {
  const sections = [
    "Nguyên tắc hoạt động",
    "Xác nhận đặt sân",
    "Trách nhiệm của người dùng",
    "Vai trò chủ sân",
    "Báo cáo & hỗ trợ",
  ];

  return (
    <OwnerStaticShell
      title="Chính sách hoạt động"
      subtitle="Quy tắc vận hành chung để đảm bảo trải nghiệm đặt sân rõ ràng và công bằng."
      sections={sections}
    >
      <Section title="Nguyên tắc hoạt động">
        <ul className="list-disc pl-5 space-y-1">
          <li>Minh bạch thông tin sân, khung giờ, giá và trạng thái đơn.</li>
          <li>Ưu tiên đúng lịch – đúng sân – đúng người.</li>
          <li>Giảm tối đa trùng lịch bằng cơ chế giữ chỗ/xác nhận.</li>
        </ul>
      </Section>

      <Section title="Xác nhận đặt sân">
        <p>
          Đơn đặt sân có thể có các trạng thái như: chờ xác nhận, đã xác nhận, đã huỷ, hoàn tất...
          Trạng thái hiển thị trên hệ thống là nguồn tham chiếu chính.
        </p>
      </Section>

      <Section title="Trách nhiệm của người dùng">
        <ul className="list-disc pl-5 space-y-1">
          <li>Đến đúng giờ, tuân thủ quy định tại sân.</li>
          <li>Kiểm tra kỹ thông tin trước khi đặt (ngày/giờ/court/giá).</li>
          <li>Không sử dụng hệ thống cho mục đích gian lận hoặc gây rối.</li>
        </ul>
      </Section>

      <Section title="Vai trò chủ sân">
        <ul className="list-disc pl-5 space-y-1">
          <li>Chủ sân chịu trách nhiệm vận hành thực tế tại địa điểm sân.</li>
          <li>Cập nhật thông tin sân, khung giờ, quy định và chính sách.</li>
          <li>PicklePickle hỗ trợ công cụ quản lý, không thay thế quản lý tại sân.</li>
        </ul>
      </Section>

      <Section title="Báo cáo & hỗ trợ">
        <p>
          Nếu phát hiện gian lận hoặc vấn đề trải nghiệm, bạn có thể gửi báo cáo trong ứng dụng.
          Vui lòng cung cấp mã đơn và mô tả chi tiết để đội hỗ trợ xử lý nhanh.
        </p>
      </Section>
    </OwnerStaticShell>
  );
}
