import Image from "next/image";
import Container from "../../layout/Container";
import StepCard from "./StepCard";

const steps = [
  {
    id: 1,
    icon: "/icons/steps/SignupIcon.png",
    title: "Bước 1: Tạo tài khoản",
    description:
      "Nhập email, mật khẩu, hoặc chọn đăng nhập bằng Google.",
  },
  {
    id: 2,
    icon: "/icons/steps/SearchIcon.png",
    title: "Bước 2: Chọn sân",
    description: "Tìm sân gần bạn, xem slot trống real-time.",
  },
  {
    id: 3,
    icon: "/icons/steps/PayIcon.png",
    title: "Bước 3: Thanh toán",
    description:
      "Chọn phương thức thanh toán và xác nhận đặt sân.",
  },
];

export default function StepsSection() {
  return (
    <section className="bg-[#bfbfbf]">
      <Container className="py-12 md:py-16">
        {/* Heading */}
        <div className="flex items-center justify-center gap-0 mb-12 md:mb-35">
          {/* bên trái = underquote */}
          <Image
            src="/icons/steps/underquote.svg"
            alt=""
            width={40}
            height={40}
            className="hidden md:block"
          />
          <h2 className="text-center text-lg md:text-2xl font-semibold text-black">
            Chỉ 3 bước để đặt sân cùng PicklePickle
          </h2>
          {/* bên phải = upperquote */}
          <Image
            src="/icons/steps/upperquote.svg"
            alt=""
            width={40}
            height={40}
            className="hidden md:block"
          />
        </div>

        {/* 3 step card */}
        <div className="grid gap-6 md:grid-cols-3 justify-items-center">
          {steps.map((step) => (
            <StepCard
              key={step.id}
              icon={step.icon}
              title={step.title}
              description={step.description}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
