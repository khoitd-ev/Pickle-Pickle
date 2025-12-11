// src/app/components/home/TaglineSection.js
import Container from "../layout/Container";

export default function TaglineSection() {
  return (
    <section className="bg-white text-black">
      <Container className="py-10 md:py-14">
        <p className="text-center text-base md:text-lg text-zinc-700 font-extrabold">
          “The court you want, exactly when you want it.”
        </p>
      </Container>
    </section>
  );
}
