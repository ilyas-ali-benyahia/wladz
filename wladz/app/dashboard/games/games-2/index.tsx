"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { GameProps } from "@/types/game";
import { schoolCases, type SchoolCase } from "./data/cases";
import { manifest } from "./manifest";
import { createSchoolScene, type SchoolScene } from "./scene";

type Phase = "explore" | "dialogue" | "decision" | "result";

const tierNames: Record<SchoolCase["tier"], string> = {
  1: "المستوى الأول · التعرّف على السلوك",
  2: "المستوى الثاني · تحليل الأدلة",
  3: "المستوى الثالث · العواقب والمسؤولية",
};

export default function Game({ player, onFinish, onExit }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SchoolScene | null>(null);
  const startedAt = useRef(0);
  const finished = useRef(false);
  const scoreRef = useRef(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("explore");
  const [nearby, setNearby] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState<string | null>(null);

  const currentCase = schoolCases[caseIndex];
  const currentStep = currentCase.steps[stepIndex];
  const selectedAnswer = selectedChoice === null
    ? null
    : currentCase.choices[selectedChoice];
  const lastCase = caseIndex === schoolCases.length - 1;

  const openDialogue = useCallback(() => {
    setPhase((current) => current === "explore" ? "dialogue" : current);
  }, []);

  useEffect(() => {
    startedAt.current = Date.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    let statusTimer: number | undefined;

    try {
      sceneRef.current = createSchoolScene(canvas, setNearby, openDialogue);
      statusTimer = window.setTimeout(() => setSceneReady(true), 0);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "تعذّر تحميل مشهد اللعبة ثلاثي الأبعاد.";
      statusTimer = window.setTimeout(() => setSceneError(message), 0);
    }

    return () => {
      if (statusTimer !== undefined) window.clearTimeout(statusTimer);
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, [openDialogue]);

  useEffect(() => {
    if (phase === "explore") {
      sceneRef.current?.setTarget(currentStep.target);
      sceneRef.current?.setOutcome(-1);
    }
  }, [caseIndex, currentStep.target, phase, stepIndex]);

  function continueDialogue() {
    if (stepIndex + 1 < currentCase.steps.length) {
      setStepIndex((current) => current + 1);
      setPhase("explore");
      return;
    }
    setPhase("decision");
  }

  function choose(index: number) {
    if (finished.current || phase !== "decision") return;
    const answer = currentCase.choices[index];
    if (!answer) return;
    scoreRef.current += answer.score;
    setSelectedChoice(index);
    sceneRef.current?.setOutcome(index);
    setPhase("result");
  }

  function finish() {
    if (finished.current || !lastCase || phase !== "result") return;
    finished.current = true;
    onFinish({
      score: Math.round((scoreRef.current / schoolCases.length) * 100),
      pointsEarned: Math.round(
        (scoreRef.current / schoolCases.length) * manifest.maxPointsPerRun,
      ),
      completed: true,
      durationMs: Math.max(0, Date.now() - startedAt.current),
    });
  }

  function nextCase() {
    if (lastCase || phase !== "result") return;
    setCaseIndex((current) => current + 1);
    setStepIndex(0);
    setSelectedChoice(null);
    setPhase("explore");
  }

  if (sceneError) {
    return (
      <section dir="rtl" className="wlG2Error">
        <h2 className="wlG2ErrorTitle">تعذّر تحميل العالم ثلاثي الأبعاد</h2>
        <p role="alert" className="wlG2ErrorText">{sceneError}</p>
        <p className="wlG2ErrorText">
          جرّب فتح اللعبة في متصفح يدعم WebGL. لا يمكن تشغيل هذه التجربة دون الرسومات ثلاثية الأبعاد.
        </p>
        <button type="button" onClick={onExit} className="wlG2PrimaryButton">
          العودة
        </button>
      </section>
    );
  }

  const progressCount = caseIndex + (phase === "result" ? 1 : 0);

  return (
    <section dir="rtl" className="wlG2Game">
      <header className="wlG2Header">
        <div className="wlG2Heading">
          <p className="wlG2Eyebrow">
            <span className="wlG2EyebrowDot" aria-hidden="true" />
            مغامرة تربوية ثلاثية الأبعاد
          </p>
          <h2 className="wlG2Title">ساحة الاحترام</h2>
          <p className="wlG2Subtitle">
            استكشف الموقف، اجمع الأدلة، واختر كيف تصنع فرقًا.
          </p>
        </div>
        <div className="wlG2PlayerBadge">
          <span className="wlG2Avatar" aria-hidden="true">
            {player.firstName.slice(0, 1)}
          </span>
          <span className="wlG2PlayerMeta">
            <span className="wlG2PlayerLabel">المستكشف</span>
            <span className="wlG2PlayerName">{player.firstName}</span>
          </span>
        </div>
      </header>

      <div className="wlG2Campaign">
        <div className="wlG2CampaignTop">
          <span>رحلة القضايا</span>
          <strong>{progressCount} / {schoolCases.length}</strong>
        </div>
        <div
          className="wlG2ProgressTrack"
          role="progressbar"
          aria-label="تقدم القضايا"
          aria-valuemin={0}
          aria-valuemax={schoolCases.length}
          aria-valuenow={progressCount}
        >
          <div
            className="wlG2ProgressFill"
            style={{ width: `${(progressCount / schoolCases.length) * 100}%` }}
          />
        </div>
        <div className="wlG2TierRail" aria-label="مستويات الحملة">
          {([1, 2, 3] as const).map((tier) => {
            const tierCases = schoolCases.filter((item) => item.tier === tier);
            const tierStart = schoolCases.findIndex((item) => item.tier === tier);
            const tierEnd = tierStart + tierCases.length;
            const completed = progressCount >= tierEnd;
            const active = currentCase.tier === tier;
            const tierClass = [
              "wlG2Tier",
              active ? "wlG2TierActive" : "",
              completed ? "wlG2TierDone" : "",
            ].filter(Boolean).join(" ");

            return (
              <div
                key={tier}
                className={tierClass}
                aria-current={active ? "step" : undefined}
              >
                <span className="wlG2TierNumber">{tier}</span>
                <span>{tierNames[tier].split("·")[1].trim()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="wlG2WorldFrame">
        <canvas
          ref={canvasRef}
          aria-label="ساحة مدرسة جزائرية ثلاثية الأبعاد قابلة للاستكشاف، تضم طلابًا ومقاعد وأدوات مدرسية"
          className="wlG2Canvas"
        />
        {!sceneReady && (
          <div className="wlG2Loading">
            <p className="wlG2LoadingText" role="status">
              جارٍ تجهيز ساحة المدرسة ثلاثية الأبعاد…
            </p>
          </div>
        )}
        {sceneReady && (
          <>
            <div className="wlG2Hud">
              <p className="wlG2HudPill">
                <span className="wlG2EyebrowDot" aria-hidden="true" />
                {phase === "explore" ? currentCase.opening : "اسحب المشهد لتدوير الكاميرا"}
              </p>
              <p className="wlG2HudPill hidden sm:flex">
                WASD / الأسهم · E تفاعل
              </p>
            </div>
            {phase === "explore" && (
              <p className="wlG2Objective">
                <span className="wlG2ObjectiveMark" aria-hidden="true" />
                {nearby
                  ? `أنت قريب من ${currentStep.targetLabel}. اضغط «تفاعل» للاستكشاف.`
                  : `اقترب من ${currentStep.targetLabel} لاستكشاف القضية`}
              </p>
            )}
          </>
        )}
      </div>

      <div className="wlG2PlayArea">
        <div className="wlG2StoryCard" aria-live="polite">
          {phase === "explore" && (
            <>
              <p className="wlG2StoryLabel">
                <span className="wlG2StoryLabelMark" aria-hidden="true">⌖</span>
                مهمتك الآن
              </p>
              <p className="wlG2StoryText">
                {nearby
                  ? `اقتربت من ${currentStep.targetLabel}. تفاعل معه لتقرأ الدليل وتفهم ما حدث.`
                  : "تجوّل في الساحة ثلاثية الأبعاد. ابحث عن الشخصية أو العنصر المضيء."}
              </p>
            </>
          )}
          {phase === "dialogue" && (
            <>
              <p className="wlG2StoryLabel">
                <span className="wlG2StoryLabelMark" aria-hidden="true">✦</span>
                {currentStep.targetLabel} · الدليل {stepIndex + 1} من {currentCase.steps.length}
              </p>
              <p className="wlG2StoryText">{currentStep.dialogue}</p>
              <button
                type="button"
                onClick={continueDialogue}
                className="wlG2PrimaryButton"
              >
                {stepIndex + 1 < currentCase.steps.length
                  ? "متابعة استكشاف الأدلة"
                  : "تحليل الموقف"}
              </button>
            </>
          )}
          {phase === "decision" && (
            <>
              <p className="wlG2StoryLabel">
                <span className="wlG2StoryLabelMark" aria-hidden="true">؟</span>
                فكّر قبل أن تختار
              </p>
              <p className="wlG2StoryText">{currentCase.question}</p>
            </>
          )}
          {phase === "result" && selectedAnswer && (
            <>
              <p className="wlG2StoryLabel">
                <span className="wlG2StoryLabelMark" aria-hidden="true">✓</span>
                أحسنت، فكّر في أثر قرارك
              </p>
              <p className="wlG2StoryFeedback">{selectedAnswer.feedback}</p>
              <p className="wlG2StoryMeta">
                تقدّمك في القضايا: {progressCount} من {schoolCases.length}
              </p>
              <button
                type="button"
                onClick={lastCase ? finish : nextCase}
                className="wlG2PrimaryButton"
              >
                {lastCase ? "إنهاء الرحلة" : "متابعة القضية التالية"}
              </button>
            </>
          )}
        </div>

        <div className="wlG2ControlPanel">
          {phase === "explore" && (
            <>
              <p className="wlG2ControlHint">تحكّم بالحركة</p>
              <div className="wlG2Dpad" aria-label="أزرار تحريك اللاعب">
                <span className="wlG2DpadSpacer" />
                <TouchControl code="KeyW" label="تحرك إلى الأمام">↑</TouchControl>
                <span className="wlG2DpadSpacer" />
                <TouchControl code="KeyA" label="تحرك إلى اليسار">←</TouchControl>
                <TouchControl code="KeyS" label="تحرك إلى الخلف">↓</TouchControl>
                <TouchControl code="KeyD" label="تحرك إلى اليمين">→</TouchControl>
              </div>
              <button
                type="button"
                disabled={!nearby || !sceneReady}
                onClick={() => sceneRef.current?.interact()}
                className="wlG2ActionButton"
              >
                تفاعل
              </button>
            </>
          )}
          {phase === "decision" && (
            <div className="wlG2ChoiceList">
              <p className="wlG2ControlHint">اختر تصرفك</p>
              {currentCase.choices.map((choice, index) => (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => choose(index)}
                  className="wlG2ChoiceButton"
                >
                  <span className="wlG2ChoiceNumber">{index + 1}</span>
                  {choice.label}
                </button>
              ))}
            </div>
          )}
          {phase === "result" && (
            <p className="wlG2ControlHint">
              {lastCase ? "وصلت إلى نهاية الرحلة!" : "القضية التالية تنتظرك"}
            </p>
          )}
        </div>
      </div>

      <footer className="wlG2Footer">
        <p className="wlG2FooterHint">
          اسحب العالم لتدوير الكاميرا · الحركة متاحة بلوحة المفاتيح واللمس
        </p>
        <button
          type="button"
          onClick={onExit}
          className="wlG2ExitButton"
        >
          خروج
        </button>
      </footer>
    </section>
  );
}

function TouchControl({
  code,
  label,
  children,
}: {
  code: string;
  label: string;
  children: string;
}) {
  const pressed = useRef(false);

  function release() {
    if (!pressed.current) return;
    pressed.current = false;
    window.dispatchEvent(new KeyboardEvent("keyup", { code, bubbles: true }));
  }

  function press(event: PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (pressed.current) return;
    pressed.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    window.dispatchEvent(new KeyboardEvent("keydown", { code, bubbles: true }));
  }

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="wlG2DirectionButton"
    >
      {children}
    </button>
  );
}
