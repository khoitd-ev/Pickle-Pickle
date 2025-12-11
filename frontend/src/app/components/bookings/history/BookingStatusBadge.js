


export default function BookingStatusBadge({ status, label }) {
  // Tạm thời chỉ return span, sau này style theo design
  return (
    <span>
      {label || status}
    </span>
  );
}
