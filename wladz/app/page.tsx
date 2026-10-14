import Footer from "@/components/landing/Footer";
import GamesPreview from "@/components/landing/GamesPreview";
import Hero from "@/components/landing/Hero";
import WhyWladz from "@/components/landing/WhyWladz";
import Navbar from "@/components/landing/Navbar";
import "@/components/landing/landing.css";

export default function Home() {
  return (
    <div className="landing-page">
      <a className="skip-link" href="#games">انتقل إلى الألعاب</a>
      <Navbar />
      <main id="main-content">
        <Hero />
        <GamesPreview />
        <WhyWladz />
      </main>
      <Footer />
    </div>
  );
}
