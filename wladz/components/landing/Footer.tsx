"use client";

import Image from "next/image";
import Lake from "./Lake";
import Icon from "./Icon";
import { useParallax } from "./useParallax";

export default function Footer() {
  const ref = useParallax<HTMLElement>();

  return (
    <footer ref={ref} className="landing-footer">
      <Lake deep />
      <div className="footer-content section-shell">
        {/* Deux logos séparés par un trait blanc (styles .wz-footer-grid dans app/ui.css). */}
        <div className="footer-main wz-footer-grid">
          <a
            href="#home"
            className="wz-footer-logo footer-logo"
            aria-label="ولادز — العودة إلى الرئيسية"
          >
            <Image
              src="/images/logo-3.png"
              alt="ولادز"
              width={1000}
              height={418}
            />
          </a>
          <div className="wz-footer-tag footer-tag">
            <p>
              نلعب، نتعلّم، ونكبر بقيم جميلة. مغامرات صغيرة تصنع فرقًا كبيرًا.
            </p>
            <span>
              صُنع بحبّ لأبناء الجزائر
              <Icon name="heart" />
            </span>
          </div>
          <span className="wz-footer-line" aria-hidden="true" />
          <div
            className="wz-footer-ministry ministry-motion"
            data-parallax-y={-30}
            data-parallax-scale={0.04}
          >
            <div className="ministry-logo">
              <Image
                src="/landing/ministere-jeunesse-sport.svg"
                alt="شعار وزارة الشباب والرياضة الجزائرية"
                width={2342}
                height={2004}
              />
            </div>
            <p className="ministry-caption">بدعم من وزارة الشباب والرياضة</p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            <bdi>© 2026 WLADZ</bdi> — جميع الحقوق محفوظة
          </p>
          <a href="#home">
            إلى الأعلى
            <Icon name="arrow" />
          </a>
        </div>
      </div>
    </footer>
  );
}
