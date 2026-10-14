import Footer from "@/components/landing/Footer";
import GamesPreview from "@/components/landing/GamesPreview";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import Navbar from "@/components/landing/Navbar";

export default function Home() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#games">انتقل إلى الألعاب</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <GamesPreview />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
