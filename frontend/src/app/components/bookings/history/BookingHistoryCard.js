import Image from "next/image";
import BookingStatusBadge from "./BookingStatusBadge";

export default function BookingHistoryCard({
  booking,
  onViewDetail,
  onCancel,
}) {
  const {
    courtName,
    courtCode,
    date,
    startTime,
    endTime,
    status, // có thể undefined với dữ liệu mock
    statusLabel,
    rating,
    reviews,
    imageUrl,
    isFavorite,
  } = booking;

  // Sau này nếu BE có status rõ hơn, chỉ việc update điều kiện ở đây
  const statusLower = (status || "").toString().toLowerCase();
  const labelLower = (statusLabel || "").toString().toLowerCase();

  const isAlreadyCancelled =
    statusLower.includes("cancel") ||
    labelLower.includes("hủy") ||
    labelLower.includes("huỷ");

  const isFinished =
    statusLower.includes("done") ||
    statusLower.includes("completed") ||
    labelLower.includes("xong");

  const canCancel = !isAlreadyCancelled && !isFinished;

  const handleViewDetailClick = () => {
    if (onViewDetail) {
      onViewDetail(booking);
    }
  };

  const handleCancelClick = () => {
    if (!canCancel) return;
    if (onCancel) {
      onCancel(booking);
    }
  };

  return (
    <article className="flex w-full rounded-[16px] bg-[#f5f5f5] border border-[#e5e5e5] overflow-hidden">
      {/* Ảnh sân */}
      <div className="relative w-[260px] h-[150px] flex-shrink-0">
        <Image
          src={imageUrl}
          alt={courtName}
          fill
          className="object-cover"
        />
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 items-stretch justify-between px-5 py-4 gap-4">
        {/* Khối trái */}
        <div className="flex flex-col gap-2 flex-1">
          {/* Tên sân + tim */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-[15px] font-semibold leading-snug text-black">
                {courtName}
              </h3>

              <div className="flex items-center gap-2 text-[11px] text-[#555]">
                <div className="flex items-center gap-1">
                  <Image
                    src="/history/starIcon.svg"
                    alt="star"
                    width={12}
                    height={12}
                  />
                  <span className="font-semibold">{rating.toFixed(1)}</span>
                </div>
                <span className="text-[#777]">Code: {courtCode}</span>
              </div>
            </div>

            <button
              type="button"
              aria-label="Yêu thích"
              className="mt-1"
            >
              <Image
                src={
                  isFavorite
                    ? "/history/hearfillIcon.svg"
                    : "/history/heartIcon.svg"
                }
                alt="favorite"
                width={20}
                height={20}
              />
            </button>
          </div>

          {/* Ngày + trạng thái */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#555]">
            <div className="flex items-center gap-1">
              <Image
                src="/history/calendarIcon.svg"
                alt="calendar"
                width={12}
                height={12}
              />
              <span>{date}</span>
            </div>

            <div className="flex items-center gap-1">
              <Image
                src="/history/bellIcon.svg"
                alt="status"
                width={12}
                height={12}
              />
              <span>Trạng thái:&nbsp;</span>
              <BookingStatusBadge status={status} label={statusLabel} />
            </div>
          </div>

          {/* Thời gian */}
          <div className="flex flex-wrap items-center gap-6 text-[11px] text-[#555]">
            <p>
              Bắt đầu: <span className="font-medium">{startTime}</span>
            </p>
            <p>
              Kết thúc: <span className="font-medium">{endTime}</span>
            </p>
          </div>
        </div>

        {/* Khối phải */}
        <div className="flex flex-col justify-between items-end min-w-[140px]">
          {/* Rating + reviews (tổng quan) */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-5 rounded-full bg-[#6b6b6b] text-[11px] text-white">
                {rating.toFixed(1)}
              </div>
              <span className="text-[11px] text-[#777]">
                {reviews} reviews
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleViewDetailClick}
              className="px-4 py-[6px] rounded-[30px] border border-[#c4c4c4] text-[11px] text-[#333] bg-[#f7f7f7] hover:bg-[#ebebeb] transition"
            >
              Chi tiết
            </button>

            <button
              type="button"
              onClick={handleCancelClick}
              disabled={!canCancel}
              className={`px-4 py-[6px] rounded-[30px] border border-[#c4c4c4] text-[11px] bg-white transition ${
                canCancel
                  ? "text-[#333] hover:bg-[#f0f0f0]"
                  : "text-[#999] cursor-not-allowed bg-[#f9f9f9]"
              }`}
            >
              Hủy sân
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
