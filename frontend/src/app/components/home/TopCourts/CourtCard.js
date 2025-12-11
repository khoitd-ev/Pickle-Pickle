import Image from "next/image";

export default function CourtCard({ court }) {
  const { name, image, courts, permLines, permNets, portableNets } = court;

  return (
    <div
      className="
        flex-shrink-0
        w-[240px] md:w-[260px]
        rounded-2xl
        overflow-hidden
        bg-black
        text-white
        shadow-[0_8px_16px_rgba(0,0,0,0.18)]
        hover:shadow-[0_14px_28px_rgba(0,0,0,0.22)]
        snap-start
        transition-transform duration-200 ease-out
        hover:-translate-y-2
        cursor-pointer
      "
    >
      {/* Ảnh sân */}
      <div className="relative h-[150px] md:h-[170px] w-full">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 240px, 260px"
        />
      </div>

      {/* Phần thông tin, text nằm sát đáy card */}
      <div className="px-4 pb-5 pt-4 bg-black flex flex-col justify-end min-h-[150px]">
        <h3 className="text-[15px] md:text-[17px] font-semibold leading-snug mb-3">
          {name}
        </h3>

        <div className="space-y-1 text-xs md:text-[13px] text-zinc-200">
          <div className="flex items-center gap-2">
            <Image
              src="/icons/courts/picklecourtIcon.svg"
              alt="Số sân"
              width={14}
              height={14}
            />
            <span>{courts} Courts</span>
          </div>

          {permLines && (
            <div className="flex items-center gap-2">
              <Image
                src="/icons/courts/PermlineIcon.svg"
                alt="Permanent lines"
                width={14}
                height={14}
              />
              <span>Perm. Lines</span>
            </div>
          )}

          {permNets && (
            <div className="flex items-center gap-2">
              <Image
                src="/icons/courts/PermnetIcon.svg"
                alt="Permanent nets"
                width={14}
                height={14}
              />
              <span>Perm. Nets</span>
            </div>
          )}

          {portableNets && (
            <div className="flex items-center gap-2">
              <Image
                src="/icons/courts/PermnetIcon.svg"
                alt="Portable nets"
                width={14}
                height={14}
              />
              <span>Portable Nets</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
