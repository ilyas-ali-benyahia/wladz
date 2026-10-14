"use client";

import type { CSSProperties } from "react";
import FunButton from "./FunButton";
import Icon from "./Icon";
import { useParallax } from "./useParallax";

const steps = [
  {
    title: "أنشئ حسابك",
    description: "بمساعدة والديك، أنشئ حسابك وابدأ رحلتك معنا.",
    icon: "user",
  },
  {
    title: "اختر موضوعًا",
    description: "التطوع، الوقاية، التاريخ، الأخلاق… ماذا تريد أن تكتشف اليوم؟",
    icon: "compass",
  },
  {
    title: "تقدّم في خريطة المستويات",
    description: "خطوة بعد خطوة، أكمل تحديات الألعاب المصغّرة وافتح مستويات جديدة.",
    icon: "route",
  },
  {
    title: "اجمع النقاط وتصدّر الترتيب",
    description: "تعلّم، حاول من جديد، واجمع النقاط مع كل إنجاز تحقّقه.",
    icon: "trophy",
  },
  {
    title: "عش المغامرات الكبرى",
    description: "استكشف عوالم مفتوحة وقصصًا ممتعة، واكسب المزيد من النقاط.",
    icon: "rocket",
  },
] as const;

export default function HowItWorks() {
  const ref = useParallax<HTMLElement>();

  return (
    <section
      ref={ref}
      id="how-to-play"
      className="how-section"
      aria-labelledby="how-title"
    >
      <div className="section-shell">
        <header className="how-heading" data-reveal>
          <p className="section-kicker">
            <Icon name="route" />
            مغامرتك تبدأ بخطوة
          </p>
          <h2 id="how-title">
            كيف تلعب في <bdi>WLADZ</bdi>؟
          </h2>
          <p>من أول اكتشاف إلى إنجاز تفخر به… هذه خريطة رحلتك.</p>
        </header>

        <ol className="roadmap">
          {steps.map((step, index) => (
            <li
              key={step.icon}
              className="roadmap-step"
              data-parallax-y={index % 2 === 0 ? -15 : -35}
            >
              <div
                className="step-card"
                data-reveal
                style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties}
              >
                <span className="step-number" aria-hidden="true">
                  0{index + 1}
                </span>
                <span
                  className={`step-icon${step.icon === "trophy" ? " step-icon--gold" : ""}`}
                  aria-hidden="true"
                >
                  <Icon name={step.icon} />
                </span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="journey-cta" data-reveal>
          <Icon name="spark" />
          <h3>مستعدّ للانطلاق؟</h3>
          <p>مغامرة جديدة، معرفة جديدة، ونسخة أفضل منك.</p>
          <FunButton href="/login">ابدأ المغامرة</FunButton>
        </div>
      </div>
    </section>
  );
}
