import OwnerStaticShell, { Section } from "../(static)/_components/OwnerStaticShell";

export default function Page() {
  const sections = ["PicklePickle là gì?", "Sứ mệnh", "Giá trị mang lại", "Liên hệ"];

  return (
    <OwnerStaticShell
      title="Về chúng tôi"
      subtitle="PicklePickle giúp người chơi tìm sân nhanh, đặt lịch dễ và minh bạch thông tin."
      sections={sections}
    >
      <Section title="PicklePickle là gì?">
        <p>
          PicklePickle là nền tảng đặt sân pickleball trực tuyến. Bạn có thể tìm sân theo khu vực,
          xem thông tin cơ bản (địa chỉ, số lượng sân, khung giờ) và đặt sân trực tiếp trên hệ thống.
        </p>
      </Section>

      <Section title="Sứ mệnh">
        <ul className="list-disc pl-5 space-y-1">
          <li>Giảm thời gian tìm sân và liên hệ đặt sân thủ công.</li>
          <li>Chuẩn hoá trải nghiệm đặt sân: rõ ràng, nhanh, ít sai sót.</li>
          <li>Hỗ trợ chủ sân quản lý lịch tốt hơn, hạn chế trùng lịch.</li>
        </ul>
      </Section>

      <Section title="Giá trị mang lại">
        <ul className="list-disc pl-5 space-y-1">
          <li>Trải nghiệm đặt sân mượt, dễ thao tác trên mobile lẫn desktop.</li>
          <li>Thông tin sân minh bạch: địa điểm, số sân, tiện ích (tuỳ sân).</li>
          <li>Lịch sử đặt sân và theo dõi trạng thái đặt sân.</li>
        </ul>
      </Section>

      <Section title="Liên hệ">
        <p>
          Nếu bạn là chủ sân/CLB muốn hợp tác, vui lòng liên hệ qua kênh hỗ trợ trong ứng dụng
          hoặc email hỗ trợ của dự án (bạn thay email thật sau).
        </p>
      </Section>
    </OwnerStaticShell>
  );
}
