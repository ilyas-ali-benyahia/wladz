"use client";

import { useEffect, useRef } from "react";

const layerSelector =
  "[data-parallax-x], [data-parallax-y], [data-parallax-scale], [data-parallax-fade]";

function amount(value: string | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** Attach the returned ref to a section; keep CSS animations on inner wrappers. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const revealElements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    const layers = Array.from(root.querySelectorAll<HTMLElement>(layerSelector)).map(
      (element) => ({
        element,
        x: amount(element.dataset.parallaxX),
        y: amount(element.dataset.parallaxY),
        scale: amount(element.dataset.parallaxScale),
        fade: amount(element.dataset.parallaxFade),
        transform: element.style.transform,
        opacity: element.style.opacity,
        willChange: element.style.willChange,
      }),
    );
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileViewport = window.matchMedia("(max-width: 767px)");
    let reducedMotion = motionPreference.matches;
    let frame = 0;
    let active = false;

    function revealAll() {
      revealElements.forEach((element) => {
        element.dataset.revealed = "true";
      });
    }

    // Without observers, the server-rendered content stays fully readable.
    if (!("IntersectionObserver" in window)) {
      revealAll();
      return;
    }

    function restoreLayers() {
      layers.forEach(({ element, transform, opacity, willChange }) => {
        element.style.transform = transform;
        element.style.opacity = opacity;
        element.style.willChange = willChange;
      });
    }

    function updateLayers() {
      frame = 0;
      if (!root || reducedMotion || !active || document.hidden) return;

      const bounds = root.getBoundingClientRect();
      const progress = clamp(
        root.dataset.parallaxOrigin === "top"
          ? -bounds.top / Math.max(bounds.height, 1)
          : (window.innerHeight - bounds.top) /
              Math.max(window.innerHeight + bounds.height, 1),
      );
      const distance = progress * (mobileViewport.matches ? 0.35 : 1);

      layers.forEach(({ element, x, y, scale, fade }) => {
        if (x !== 0 || y !== 0 || scale !== 0) {
          element.style.transform = `translate3d(${x * distance}px, ${y * distance}px, 0) scale(${1 + scale * distance})`;
        }
        if (fade !== 0) element.style.opacity = String(clamp(1 - fade * distance));
      });
    }

    function scheduleUpdate() {
      if (!frame && active && !reducedMotion && !document.hidden) {
        frame = window.requestAnimationFrame(updateLayers);
      }
    }

    function setActive(visible: boolean) {
      active = visible;
      if (root) root.dataset.motionActive = String(visible);
      layers.forEach(({ element, x, y, scale, fade, willChange }) => {
        const properties = [];
        if (x !== 0 || y !== 0 || scale !== 0) properties.push("transform");
        if (fade !== 0) properties.push("opacity");
        element.style.willChange =
          visible && !reducedMotion && properties.length > 0
            ? properties.join(", ")
            : willChange;
      });
      if (visible) {
        scheduleUpdate();
      } else if (frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target instanceof HTMLElement) {
            entry.target.dataset.revealed = "true";
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 },
    );

    const sectionObserver = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    );

    revealElements.forEach((element) => {
      const bounds = element.getBoundingClientRect();
      // Never hide content already visible when hydration finishes.
      if (reducedMotion || (bounds.top < window.innerHeight && bounds.bottom > 0)) {
        element.dataset.revealed = "true";
      } else if (element.dataset.revealed !== "true") {
        revealObserver.observe(element);
      }
    });
    root.dataset.motionReady = "true";
    sectionObserver.observe(root);
    const initialBounds = root.getBoundingClientRect();
    setActive(initialBounds.top < window.innerHeight && initialBounds.bottom > 0);

    function onMotionChange() {
      reducedMotion = motionPreference.matches;
      if (reducedMotion) {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0;
        restoreLayers();
        revealAll();
        revealObserver.disconnect();
      } else {
        setActive(active);
      }
    }

    function onFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement)) return;
      // Keyboard navigation must never land on unrevealed content.
      let element: HTMLElement | null = event.target;
      while (element && element !== root) {
        if (element.hasAttribute("data-reveal")) {
          element.dataset.revealed = "true";
          revealObserver.unobserve(element);
        }
        element = element.parentElement;
      }
    }

    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate, { passive: true });
    document.addEventListener("visibilitychange", scheduleUpdate);
    motionPreference.addEventListener("change", onMotionChange);
    mobileViewport.addEventListener("change", scheduleUpdate);
    root.addEventListener("focusin", onFocus);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      sectionObserver.disconnect();
      revealObserver.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      document.removeEventListener("visibilitychange", scheduleUpdate);
      motionPreference.removeEventListener("change", onMotionChange);
      mobileViewport.removeEventListener("change", scheduleUpdate);
      root.removeEventListener("focusin", onFocus);
      delete root.dataset.motionReady;
      delete root.dataset.motionActive;
      restoreLayers();
    };
  }, []);

  return ref;
}

export default useParallax;
