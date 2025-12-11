import HeroSection from "./components/home/HeroSection";
import TaglineSection from "./components/home/TaglineSection";
import StepsSection from "./components/home/Steps/StepsSection";
import TopCourtsSection from "./components/home/TopCourts/TopCourtsSection";
import BenefitsSection from "./components/home/Benefits/BenefitsSection";
import AllLocationsSection from "./components/home/AllLocationsSection";

export default function Home() {
  return (
    <main className="bg-white text-black">
      <HeroSection />
      <TaglineSection />
      <StepsSection />
      <TopCourtsSection />
      <BenefitsSection />
      <AllLocationsSection />
    </main>
  );
}
