import HeroSection from "./components/Hero";
import Details1 from "./components/Details1";
import Details2 from "./components/Details2";
import Details3 from "./components/Details3";
import FrequentlyAskedQuestions from "./components/FrequentlyAskedQuestions";
import Footer from "@/components/Footer";

export default async function Home() {
  return (
    <>
      <HeroSection />
      <Details1 />
      <Details2 />
      <Details3 />
      <FrequentlyAskedQuestions />
      <Footer />
    </>
  );
}
