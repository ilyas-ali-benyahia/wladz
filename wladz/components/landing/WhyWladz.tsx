"use client";

import type { CSSProperties } from "react";
import { Amphora, Compass, Rocket, ShieldCheck, Target, type LucideIcon } from "lucide-react";
import { IconTile } from "@/components/ui/GameIcon";
import { Tilt } from "@/components/ui/Tilt";
import Clouds from "./Clouds";
import FunButton from "./FunButton";
import Icon, { type IconName } from "./Icon";
import { useParallax } from "./useParallax";

const stats = [
  { value: "7", label: "ألعاب تعليمية" },
  { value: "58", label: "ولاية تكتشفها" },
  { value: "100%", label: "باللغة العربية" },
  { value: "0", label: "إعلانات" },
];

// Couleur de chaque thème : classe .why-topic--<tone> (landing.css) et tuile d'icône.
const topicTones = {
  mint: "#2f8f5b",
  rose: "#e2557a",
  sand: "#d9822b",
  sky: "#3a8ee6",
  violet: "#7c5ce6",
} as const;

const topics: { icon: LucideIcon; title: string; text: string; tone: keyof typeof topicTones }[] = [
  {
    icon: ShieldCheck,
    title: "الوقاية",
    text: "يتعلّم كيف يقول «لا» للتدخين والمخدرات، ومتى يطلب المساعدة.",
    tone: "mint",
  },
  {
    icon: Compass,
    title: "المهارات الحياتية",
    text: "الثقة بالنفس، احترام الآخرين، التفكير قبل المشاركة، والعمل في فريق.",
    tone: "rose",
  },
  {
    icon: Amphora,
    title: "التاريخ والتراث",
    text: "معالم الولايات الـ 58 وتقاليدها، ليعرف وطنه ويفخر به.",
    tone: "sand",
  },
  {
    icon: Target,
    title: "الرياضيات",
    text: "جداول الضرب والقسمة والحساب الذهني في تحدٍّ سريع وممتع.",
    tone: "sky",
  },
  {
    icon: Rocket,
    title: "العلوم والفضاء",
    text: "الشمس والكواكب والنجوم في رحلة ثلاثية الأبعاد.",
    tone: "violet",
  },
];

const promises: { icon: IconName; title: string; text: string }[] = [
  {
    icon: "user",
    title: "حساب بإشراف الوليّ",
    text: "يُنشأ الحساب مع رقم هاتف الوليّ، ولكل طفل حسابه ونقاطه.",
  },
  {
    icon: "shield",
    title: "مساحة آمنة",
    text: "لا إعلانات ولا دردشة مع الغرباء، ولا يظهر في الترتيب إلا الاسم الأول.",
  },
  {
    icon: "trophy",
    title: "تحفيز يدفع للتعلّم",
    text: "كل إجابة صحيحة أو مرحلة مكتملة تمنح نقاطاً ترفع الطفل في لوحة المتصدرين.",
  },
];

export default function WhyWladz() {
  const ref = useParallax<HTMLElement>();

  return (
    <section ref={ref} id="about" className="why-section" aria-labelledby="why-title">
      <Clouds section />
      <div className="section-shell">
        <header className="why-heading" data-reveal>
          <p className="section-kicker">
            <Icon name="spark" />
            عالم آمن للتعلّم واللعب
          </p>
          <h2 id="why-title">
            أكثر من مجرد <span className="outlined-word">لعب</span>
          </h2>
          <p>في كل لعبة درس صغير يبقى معك: معرفة، وقيم، ومهارات للحياة.</p>
        </header>

        <dl className="why-stats" data-reveal>
          {stats.map((stat) => (
            <Tilt key={stat.label} className="why-stat">
              <dd>
                <bdi>{stat.value}</bdi>
              </dd>
              <dt>{stat.label}</dt>
            </Tilt>
          ))}
        </dl>

        <h3 className="why-subtitle" data-reveal>
          ماذا يتعلّم طفلك؟
        </h3>
        <ul className="why-topics">
          {topics.map((topic, index) => (
            <li
              key={topic.title}
              className="why-topic-slot"
              data-reveal
              style={{ "--reveal-delay": `${index * 70}ms` } as CSSProperties}
            >
              <Tilt as="article" className={`why-topic why-topic--${topic.tone}`}>
                <IconTile icon={topic.icon} tone={topicTones[topic.tone]} size="lg" />
                <h4>{topic.title}</h4>
                <p>{topic.text}</p>
              </Tilt>
            </li>
          ))}
        </ul>

        <div className="why-parents" data-reveal>
          <div className="why-parents-intro">
            <p className="section-kicker">
              <Icon name="heart" />
              إلى الأولياء
            </p>
            <h3>نلعب معاً، ونتعلّم للحياة</h3>
            <p>منصّة تربوية مجانية صُمّمت لأطفال الجزائر، تحترم قيمنا وتضع سلامة أطفالكم أولاً.</p>
          </div>
          <ul className="why-promises">
            {promises.map((promise) => (
              <li key={promise.title}>
                <span className="why-promise-icon" aria-hidden="true">
                  <Icon name={promise.icon} />
                </span>
                <div>
                  <h4>{promise.title}</h4>
                  <p>{promise.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="journey-cta" data-reveal>
          <Icon name="spark" />
          <h3>مستعدّ للانطلاق؟</h3>
          <p>أنشئ حسابك مع أحد والديك، وابدأ أول مغامرة اليوم.</p>
          <div className="why-actions">
            <FunButton href="/register">أنشئ حسابك</FunButton>
            <FunButton href="/login" variant="secondary">
              لديّ حساب
            </FunButton>
          </div>
        </div>
      </div>
    </section>
  );
}
