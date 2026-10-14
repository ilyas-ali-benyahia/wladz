"use client";

import Image from "next/image";
import Link from "next/link";
import Clouds from "./Clouds";
import Icon from "./Icon";
import { useParallax } from "./useParallax";

export default function Footer() {
  const ref = useParallax<HTMLElement>();

  return (
    <footer ref={ref} className="landing-footer">
      <Clouds footer />
      <div className="footer-content section-shell">
        <div className="footer-main">
          <div className="footer-brand">
            <a href="#home" aria-label="ولادز — العودة إلى الرئيسية">
              <Image
                src="/images/logo-3.png"
                alt="ولادز"
                width={1412}
                height={704}
                loading="eager"
              />
            </a>
            <p>نلعب، نتعلّم، ونكبر بقيم جميلة. مغامرات صغيرة تصنع فرقًا كبيرًا.</p>
            <span>
              صُنع بحبّ لأبناء الجزائر
              <Icon name="heart" />
            </span>
          </div>

          <nav className="footer-links" aria-label="روابط أسفل الصفحة">
            <p>اكتشف ولادز</p>
            <a href="#home">الرئيسية</a>
            <a href="#games">الألعاب</a>
            <a href="#about">لماذا ولادز</a>
            <Link href="/login" prefetch={false}>
              دخول
            </Link>
            <Link href="/register" prefetch={false}>
              إنشاء حساب
            </Link>
          </nav>

          <div className="ministry-motion" data-parallax-y={-45} data-parallax-scale={0.06}>
            <div className="ministry" data-reveal>
              <div className="ministry-logo">
                <Image
                  src="/landing/ministere-jeunesse-sport.svg"
                  alt="شعار وزارة الشباب والرياضة الجزائرية"
                  width={2342}
                  height={2004}
                />
              </div>
              <p>بدعم من وزارة الشباب والرياضة</p>
            </div>
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
