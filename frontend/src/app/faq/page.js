import OwnerStaticShell, { Section } from "../(static)/_components/OwnerStaticShell";

function QA({ q, children }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="text-sm font-semibold text-zinc-950">{q}</div>
      <div className="mt-2 text-sm text-zinc-700 leading-relaxed">{children}</div>
    </div>
  );
}

export default function Page() {
  const sections = ["Tài khoản", "Đặt sân", "Thanh toán", "Huỷ & hoàn tiền", "Chủ sân"];

  return (
    <OwnerStaticShell
      title="Câu hỏi thường gặp (FAQ)"
      subtitle="Một số câu hỏi phổ biến khi sử dụng PicklePickle."
      sections={sections}
    >
      <Section title="Tài khoản">
        <div className="space-y-3">
          <QA q="Tôi đăng ký rồi nhưng chưa xác minh thì sao?">
            Bạn cần hoàn tất bước xác minh (verify). Nếu hệ thống yêu cầu, hãy vào trang verify để nhận mã và xác nhận.
          </QA>
          <QA q="Tôi quên mật khẩu thì làm thế nào?">
            Vào trang đăng nhập → Quên mật khẩu và làm theo hướng dẫn để đặt lại.
          </QA>
        </div>
      </Section>

      <Section title="Đặt sân">
        <div className="space-y-3">
          <QA q="Tại sao tôi không thấy khung giờ trống?">
            Có thể khung giờ đã được đặt hoặc sân tạm đóng. Hãy thử đổi ngày hoặc chọn sân khác.
          </QA>
          <QA q="Tôi đặt nhầm giờ, có đổi được không?">
            Tuỳ chính sách sân và tình trạng trống lịch. Bạn có thể huỷ và đặt lại nếu được phép.
          </QA>
        </div>
      </Section>

      <Section title="Thanh toán">
        <div className="space-y-3">
          <QA q="Có sân bắt buộc đặt cọc không?">
            Một số sân có thể yêu cầu. Hệ thống sẽ hiển thị rõ trước khi bạn xác nhận.
          </QA>
          <QA q="Thanh toán xong nhưng trạng thái chưa cập nhật?">
            Hãy chờ vài phút và tải lại trang. Nếu vẫn lỗi, gửi mã đơn (booking id) cho bộ phận hỗ trợ.
          </QA>
        </div>
      </Section>

      <Section title="Huỷ & hoàn tiền">
        <div className="space-y-3">
          <QA q="Huỷ có mất phí không?">
            Tuỳ sân và tuỳ thời điểm huỷ. Xem chi tiết tại trang “Chính sách huỷ & hoàn tiền”.
          </QA>
          <QA q="Bao lâu thì tôi nhận được tiền hoàn?">
            Phụ thuộc phương thức thanh toán và ngân hàng/đối tác. Hệ thống sẽ cập nhật tiến độ khi có thay đổi.
          </QA>
        </div>
      </Section>

      <Section title="Chủ sân">
        <div className="space-y-3">
          <QA q="Tôi là chủ sân, làm sao đưa sân lên hệ thống?">
            Bạn cần đăng ký tài khoản owner và hoàn thiện thông tin sân. Sau đó đội vận hành sẽ hỗ trợ kích hoạt.
          </QA>
          <QA q="Tôi muốn cập nhật giá/giờ hoạt động thì làm ở đâu?">
            Trong trang quản trị owner, bạn có thể cấu hình khung giờ/giá tuỳ theo module hệ thống hiện tại.
          </QA>
        </div>
      </Section>
    </OwnerStaticShell>
  );
}
