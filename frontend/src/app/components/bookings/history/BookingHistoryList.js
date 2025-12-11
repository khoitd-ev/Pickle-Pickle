import BookingHistoryCard from "./BookingHistoryCard";

export default function BookingHistoryList({
  bookings,
  onViewDetail,
  onCancel,
}) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-sm text-[#666] mt-8">
        Bạn chưa có lịch sử đặt sân.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {bookings.map((item) => (
        <BookingHistoryCard
          key={item.id}
          booking={item}
          onViewDetail={onViewDetail}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
}
