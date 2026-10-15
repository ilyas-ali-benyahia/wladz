"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

const links = [
  { id: "home", label: "الرئيسية" },
  { id: "games", label: "الألعاب" },
  { id: "about", label: "لماذا ولادز" },
] as const;

type SectionId = (typeof links)[number]["id"];

export default function Navbar() {
  const [active, setActive] = useState<SectionId>("home");
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const linksRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // Follows the scroll: highlights the section under the navigation and slims the bar after the hero.
  useEffect(() => {
    let frame = 0;

    function update() {
      frame = 0;
      const marker = window.innerHeight * 0.4;
      let current: SectionId = links[0].id;
      for (const link of links) {
        const section = document.getElementById(link.id);
        if (section && section.getBoundingClientRect().top <= marker) current = link.id;
      }
      setActive(current);

      const hero = document.getElementById("home");
      setCompact(hero ? hero.getBoundingClientRect().bottom < 140 : window.scrollY > 200);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  // Slides the highlight pill under the active link.
  useEffect(() => {
    function place() {
      const indicator = indicatorRef.current;
      const target = linksRef.current?.querySelector<HTMLElement>(`[data-section="${active}"]`);
      if (!indicator || !target) return;
      indicator.style.width = `${target.offsetWidth}px`;
      indicator.style.transform = `translateX(${target.offsetLeft}px)`;
      indicator.dataset.ready = "true";
    }

    place();
    window.addEventListener("resize", place, { passive: true });
    document.fonts?.ready.then(place);
    return () => window.removeEventListener("resize", place);
  }, [active, compact]);

  useEffect(() => {
    if (!menuOpen) return;
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [menuOpen]);

  return <header className="landing-header" data-compact={compact}>
    <nav className="landing-nav" aria-label="القائمة الرئيسية">
      <a href="#home" className="nav-brand" aria-label="ولادز — الرئيسية"><Image src="/images/wladz-logo.webp" alt="WLADZ" width={1000} height={418} loading="eager" /></a>
      <div className="nav-links nav-links--desktop" ref={linksRef}>
        <span className="nav-indicator" ref={indicatorRef} aria-hidden="true" />
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            data-section={link.id}
            aria-current={active === link.id ? "true" : undefined}
            onClick={() => setActive(link.id)}
          >
            {link.label}
          </a>
        ))}
      </div>
      <Link href="/login" prefetch={false} className="nav-login"><span className="button-sweep" aria-hidden="true" /><span>دخول</span> <Icon name="arrow" /></Link>
      <button
        type="button"
        className="nav-menu-button"
        aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
        aria-expanded={menuOpen}
        aria-controls="landing-mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X /> : <Menu />}
      </button>
    </nav>
    <div className="nav-mobile-layer" data-open={menuOpen} onClick={() => setMenuOpen(false)}>
      <div id="landing-mobile-menu" className="nav-mobile-panel" onClick={(event) => event.stopPropagation()}>
        <div className="nav-mobile-heading">
          <span>اكتشف ولادز</span>
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة"><X /></button>
        </div>
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            aria-current={active === link.id ? "true" : undefined}
            onClick={() => {
              setActive(link.id);
              setMenuOpen(false);
            }}
          >
            {link.label}
          </a>
        ))}
        <Link href="/login" prefetch={false} className="nav-mobile-login">دخول <Icon name="arrow" /></Link>
      </div>
    </div>
  </header>;
}
