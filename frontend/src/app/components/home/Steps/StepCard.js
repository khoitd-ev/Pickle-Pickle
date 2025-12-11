import Image from "next/image";

export default function StepCard({ icon, title, description }) {
  return (
    <div className="group flex justify-center">
      <div
        className="
          relative
          w-[276px] h-[348px]           /* gần đúng kích thước Figma */
          bg-no-repeat bg-cover bg-center
          flex flex-col justify-center
          px-6 pb-10 pt-12
          transition-all duration-200
          group-hover:scale-[1.03]
          group-hover:-translate-y-1
          group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.25)]
        "
        style={{ backgroundImage: "url('/icons/steps/StepCard.svg')" }}
      >
        {/* ICON TO, ĐÈ LÊN MÉP TRÊN CARD */}
        {icon && (
          <div className="absolute -top-32 left-1/5 -translate-x-1/7">
            <Image
              src={icon}
              alt={title}
              width={220}
              height={220}
              className="h-90 w-60 md:w-60 md:h-80"
            />
          </div>
        )}

        {/* TEXT CĂN TRÁI, GIỮ TƯƠNG ĐỐI Ở GIỮA CARD */}
        <div className="mt-10">
          <h3 className="text-[20px] font-semibold text-black text-left">
            {title}
          </h3>
          <p className="mt-2 text-sm text-zinc-700 leading-relaxed text-left">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
