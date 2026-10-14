"use client";

import Image from "next/image";
import Clouds from "./Clouds";
import FloatingTags from "./FloatingTags";
import FunButton from "./FunButton";
import Icon from "./Icon";
import { useParallax } from "./useParallax";

export default function Hero() {
  const ref = useParallax<HTMLElement>();
  return <section id="home" className="hero" ref={ref} data-parallax-origin="top" aria-labelledby="hero-title">
    <div className="sky-halo" aria-hidden="true" />
    <Clouds />
    <FloatingTags />
    <div className="hero-content" data-parallax-y="180" data-parallax-fade="0.75">
      <p className="hero-eyebrow intro intro--one"><span />صغار اليوم، أبطال الغد</p>
      <h1 id="hero-title" className="hero-logo intro-logo"><Image src="/landing/nn.webp" alt="WLADZ — ولادز" width={800} height={598} loading="eager" fetchPriority="high" /></h1>
      {/* Slogan provisoire, à valider avec l’équipe. */}
      <p className="hero-slogan intro intro--two">العب، تعلّم، وكن فخورًا <span>بوطنك<svg viewBox="0 0 220 16" aria-hidden="true"><path d="M4 11Q99-4 216 8M31 15Q108 6 185 12" /></svg></span></p>
      <p className="hero-description intro intro--three">كل لعبة حكاية. كل خطوة اكتشاف.<br />عالم من المغامرات، يكبر معك.</p>
      <div className="hero-actions intro intro--four"><FunButton href="/login">ابدأ المغامرة</FunButton><FunButton href="#games" variant="secondary">اكتشف الألعاب</FunButton></div>
      <p className="hero-note intro intro--four"><Icon name="heart" />نلعب معًا، ونتعلّم للحياة</p>
    </div>
    <div className="hero-spark hero-spark--one" aria-hidden="true"><Icon name="spark" /></div>
    <div className="hero-spark hero-spark--two" aria-hidden="true"><Icon name="spark" /></div>
    <a href="#games" className="scroll-cue"><span className="scroll-cue-line" />مرّر للأسفل<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg></a>
    <div className="hero-floor" aria-hidden="true" />
  </section>;
}
