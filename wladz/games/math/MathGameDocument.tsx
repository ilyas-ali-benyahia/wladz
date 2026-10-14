"use client";

import { useEffect } from "react";
import { exitFramedGame } from "@/games/exitFramedGame";
import "@/games/math/math.css";

// Structure HTML du jeu « Solve & Shoot » (index.html d'origine), textes traduits en arabe.
// Le moteur (games/math/engine/main.js) pilote ces éléments par leurs id : ne pas les renommer.
// Cette page s'affiche seule dans une iframe plein écran (voir MathLauncher).
export function MathGameDocument() {
  useEffect(() => {
    // Bonne réponse : le serveur ajoute le point (avec un plafond par jour).
    function onCorrect() {
      void fetch("/api/games/math/correct", { method: "POST" }).catch(() => {});
    }
    window.addEventListener("solve-and-shoot:correct", onCorrect);
    window.addEventListener("solve-and-shoot:exit", exitFramedGame);

    // Le moteur s'exécute une seule fois par document ; l'iframe est détruite en quittant.
    void import("@/games/math/engine/main.js");

    return () => {
      window.removeEventListener("solve-and-shoot:correct", onCorrect);
      window.removeEventListener("solve-and-shoot:exit", exitFramedGame);
    };
  }, []);

  return (
    <div id="math-game" dir="ltr" suppressHydrationWarning>
      <canvas id="c" />

      <div id="hud">
        <div id="q-wrap">
          <div id="q-label">احسب وصوّب</div>
          <div id="q-text">—</div>
          <div id="timer-track">
            <div id="timer-bar" />
          </div>
          <div id="feedback" role="status" aria-live="polite" />
        </div>
        <div id="wave-ann">الموجة 1</div>
        <div id="stats">
          <div className="stat">
            <div className="lbl">الموجة</div>
            <div className="val" id="wave-val">
              1
            </div>
          </div>
          <div className="stat">
            <div className="lbl">النتيجة</div>
            <div className="val" id="score-val">
              0
            </div>
          </div>
        </div>
        <div id="hp-wrap">
          <div id="hp-label">
            الطاقة <span id="hp-val">100%</span>
          </div>
          <div
            id="hp-track"
            role="meter"
            aria-label="الطاقة"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={100}
          >
            <div id="hp-bar" />
          </div>
        </div>
        <div id="combo-wrap">
          <div id="combo-label">السلسلة</div>
          <div id="combo-val">—</div>
        </div>
        <div id="diff-badge" style={{ display: "none" }} />
        <div id="xhair" />
        <div id="aim-dot" />
        <div id="score-pop" />
      </div>

      <div id="flash" />
      <div id="dmg-vig" />
      <div id="vignette" />
      <div id="click-hint">اضغط للتصويب</div>
      <div id="fade-overlay" />

      <div id="mobile-controls" hidden>
        <button id="mobile-pause" className="touch-button touch-utility" aria-label="إيقاف مؤقت">
          <span aria-hidden="true">Ⅱ</span> توقّف
        </button>
        <button
          id="mobile-sound"
          className="touch-button touch-utility"
          aria-label="إيقاف الصوت"
          aria-pressed="false"
        >
          الصوت يعمل
        </button>
        <button
          id="aim-stick"
          className="touch-button"
          aria-label="التصويب: حرّك إبهامك للدوران. يمكنك استعمال الأسهم أيضاً."
        >
          <span id="aim-knob" aria-hidden="true" />
          <span className="aim-label" aria-hidden="true">
            صوّب
          </span>
        </button>
        <button id="fire-btn" className="touch-button" aria-label="أطلق مرة واحدة" disabled>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <circle cx="16" cy="16" r="9" />
            <path d="M16 1v9m0 12v9M1 16h9m12 0h9" />
          </svg>
          <span>أطلق</span>
        </button>
      </div>

      <div
        id="rotate-screen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rotate-title"
        aria-describedby="rotate-description"
        tabIndex={-1}
        hidden
      >
        <svg
          viewBox="0 0 100 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <rect x="12" y="24" width="76" height="40" rx="7" />
          <path d="M21 38v12M43 9a28 28 0 0 1 30 6m-1-10 2 11-11 1" />
          <circle cx="79" cy="44" r="2" />
        </svg>
        <h1 id="rotate-title">أدِر الهاتف لتلعب</h1>
        <p id="rotate-description">
          أدِر هاتفك أو لوحتك إلى الوضع الأفقي لتتحكّم بإبهاميك وترى الساحة بوضوح.
        </p>
        <small>اللعبة متوقفة إلى أن تدير الهاتف.</small>
        <button className="fullscreen-btn" hidden>
          ملء الشاشة
        </button>
        <button className="btn exit-game">خروج من اللعبة</button>
      </div>

      <button id="back-btn" className="btn">
        ◂ القائمة
      </button>
      <div id="pause-hint">ESC — توقّف&nbsp;&nbsp;·&nbsp;&nbsp;M — الصوت</div>

      <div id="start-screen" className="screen">
        <div className="menu-content">
          <div className="menu-kicker">رياضيات · تحدّي الروبوتات</div>
          <h1>
            احسب<span>وصوّب</span>
          </h1>
          <p>
            حُلّ العملية، ثم صوّب نحو الروبوت الذي يحمل الجواب الصحيح.
            <br />
            ركّز جيداً قبل أن تقترب الروبوتات!
          </p>
          <div id="diff-select">
            <button className="diff-btn active-easy" data-diff="easy" aria-pressed="true">
              سهل
              <small>
                جداول 1–5
                <br />
                إيقاع هادئ
              </small>
            </button>
            <button className="diff-btn" data-diff="advanced" aria-pressed="false">
              متقدّم
              <small>
                × و ÷
                <br />
                إيقاع أسرع
              </small>
            </button>
            <button className="diff-btn" data-diff="ultra" aria-pressed="false">
              خارق
              <small>
                عمليات متنوعة
                <br />
                أسرع إيقاع
              </small>
            </button>
          </div>
          <button className="btn" id="start-btn">
            ابدأ المهمة
          </button>
          <button className="btn exit-game">خروج من اللعبة</button>
          <div id="controls-hint">
            <span className="desktop-controls">
              <b>الفأرة</b> للتصويب &nbsp;·&nbsp; <b>النقر / المسافة</b> للإطلاق
              <br />
              <b>ESC</b> توقّف &nbsp;·&nbsp; <b>M</b> الصوت
            </span>
            <span className="touch-controls">
              <b>الإبهام الأيسر</b> للتصويب &nbsp;·&nbsp; <b>الزر الأيمن</b> للإطلاق
              <br />
              يمكنك أيضاً سحب الساحة للتصويب.
            </span>
          </div>
          <div className="mobile-only menu-fullscreen">
            <button className="fullscreen-btn" hidden>
              ملء الشاشة
            </button>
          </div>
        </div>
      </div>

      <div id="over-screen" className="screen" style={{ display: "none" }}>
        <h1>انتهت الجولة</h1>
        <div className="neon-line" />
        <div id="final-score">النتيجة: 0</div>
        <div id="final-wave">الموجة: 1</div>
        <div id="final-stats">الدقة 0% · أفضل سلسلة ×0</div>
        <div id="final-best">أفضل نتيجة: 0</div>
        <div id="diff-select-retry">
          <button className="diff-btn active-easy" data-diff2="easy" aria-pressed="true">
            سهل
          </button>
          <button className="diff-btn" data-diff2="advanced" aria-pressed="false">
            متقدّم
          </button>
          <button className="diff-btn" data-diff2="ultra" aria-pressed="false">
            خارق
          </button>
        </div>
        <button className="btn" id="retry-btn">
          ألعب من جديد
        </button>
        <button className="btn exit-game">خروج من اللعبة</button>
      </div>

      <div
        id="pause-screen"
        className="screen"
        style={{
          display: "none",
          opacity: 0,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          background: "rgba(2,5,16,0.5)",
          transition: "opacity 0.3s ease",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.85)",
            padding: "50px 60px",
            borderRadius: 8,
            border: "1px solid rgba(0,255,231,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            boxShadow: "0 0 40px rgba(0,0,0,0.9)",
          }}
        >
          <h1
            style={{
              color: "#00ffe7",
              textShadow: "0 0 30px rgba(0,255,231,0.5)",
              marginBottom: 32,
            }}
          >
            توقّف مؤقت
          </h1>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 20,
              width: "100%",
              maxWidth: 260,
            }}
          >
            <button className="btn pause-btn" id="resume-btn">
              أواصل
            </button>
            <button className="btn pause-btn" id="pause-restart-btn">
              من جديد
            </button>
            <button className="btn pause-btn" id="mute-btn">
              الصوت: يعمل
            </button>
            <button className="btn pause-btn" id="pause-menu-btn">
              القائمة
            </button>
            <button className="btn pause-btn exit-game">خروج من اللعبة</button>
          </div>
        </div>
      </div>

      <div id="webgl-error" className="screen">
        <h1>تعذّر تشغيل اللعبة</h1>
        <div className="neon-line" />
        <p>
          متصفّحك أو جهازك لا يستطيع تشغيل العرض الثلاثي الأبعاد الذي تحتاجه هذه اللعبة.
          <br />
          جرّب نسخة حديثة من Chrome أو Edge أو Firefox.
        </p>
        <button className="btn exit-game">خروج من اللعبة</button>
      </div>
    </div>
  );
}
