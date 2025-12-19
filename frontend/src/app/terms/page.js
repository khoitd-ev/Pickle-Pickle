import OwnerStaticShell, { Section } from "../(static)/_components/OwnerStaticShell";

export default function Page() {
  const sections = [
    "Phạm vi áp dụng",
    "Tài khoản & bảo mật",
    "Đặt sân & nghĩa vụ thanh toán",
    "Hành vi bị cấm",
    "Giới hạn trách nhiệm",
    "Thay đổi điều khoản",
  ];

  return (
    <OwnerStaticShell
      title="Điều khoản sử dụng"
      subtitle="Bằng việc sử dụng PicklePickle, bạn đồng ý với các điều khoản dưới đây."
      sections={sections}
    >
      <Section title="Phạm vi áp dụng">
        <p>
          Điều khoản này áp dụng cho người dùng đặt sân và chủ sân/đơn vị vận hành sân khi sử dụng nền tảng PicklePickle.
        </p>
      </Section>

      <Section title="Tài khoản & bảo mật">
        <ul className="list-disc pl-5 space-y-1">
          <li>Bạn chịu trách nhiệm với mọi hoạt động phát sinh từ tài khoản của mình.</li>
          <li>Không chia sẻ mật khẩu, OTP/mã xác minh cho người khác.</li>
          <li>Hãy cập nhật thông tin liên hệ chính xác để nhận thông báo quan trọng.</li>
        </ul>
      </Section>

      <Section title="Đặt sân & nghĩa vụ thanh toán">
        <ul className="list-disc pl-5 space-y-1">
          <li>Đơn đặt sân chỉ được xác nhận khi hệ thống ghi nhận trạng thái hợp lệ.</li>
          <li>Giá/khung giờ có thể thay đổi theo chính sách từng sân.</li>
          <li>Bạn cần kiểm tra kỹ ngày/giờ/court trước khi xác nhận đặt sân.</li>
        </ul>
      </Section>

      <Section title="Hành vi bị cấm">
        <ul className="list-disc pl-5 space-y-1">
          <li>Giả mạo danh tính, spam, gây ảnh hưởng đến hệ thống.</li>
          <li>Khai thác lỗi, can thiệp trái phép dữ liệu hoặc hệ thống.</li>
          <li>Đăng tải nội dung vi phạm pháp luật/thuần phong mỹ tục.</li>
        </ul>
      </Section>

      <Section title="Giới hạn trách nhiệm">
        <p>
          PicklePickle là nền tảng hỗ trợ đặt sân. Trường hợp phát sinh tranh chấp tại sân,
          hai bên ưu tiên giải quyết theo chính sách sân và quy định hiện hành.
        </p>
      </Section>

      <Section title="Thay đổi điều khoản">
        <p>
          PicklePickle có thể cập nhật điều khoản để phù hợp vận hành. Khi thay đổi quan trọng,
          hệ thống sẽ thông báo để bạn nắm rõ.
        </p>
      </Section>
    </OwnerStaticShell>
  );
}
