"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CircleHelp,
  House,
  Lightbulb,
  Lock,
  Moon,
  Orbit,
  PartyPopper,
  Rocket,
  Sparkles,
  Star,
  Telescope,
  TriangleAlert,
  Trophy,
  Undo2,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/GameIcon";
import {
  spaceBodies,
  spaceQuestionId,
  totalSpaceQuestions,
  type SpaceBody,
} from "@/games/space/data";
import type { SpaceScene } from "@/games/space/scene";
import { SpaceBodyVisual } from "@/games/space/SpaceBodyVisual";

type ActiveQuestion = {
  body: SpaceBody;
  questionIndex: number;
  // Ordre d'affichage des réponses, mélangé à chaque question.
  order: number[];
  wrongCount: number;
  feedback: Feedback | null;
  status: "open" | "saving" | "solved";
};

type Overlay = "collection" | "help" | "complete" | null;

// Message sous la question : son icône dépend du type (à la place des emojis).
type Feedback = { kind: "wrong" | "hint" | "success" | "error"; text: string; awarded?: boolean };

const feedbackIcons: Record<Feedback["kind"], LucideIcon> = {
  wrong: CircleHelp,
  hint: Lightbulb,
  success: PartyPopper,
  error: TriangleAlert,
};

const letters = ["أ", "ب", "ج"];
const coreBodies = spaceBodies.filter((body) => body.core);

const badges = [
  { icon: Star, name: "مستكشف مبتدئ", desc: "أول اكتشاف لك", earned: (ids: string[]) => ids.length >= 1 },
  {
    icon: Orbit,
    name: "صديق الكواكب",
    desc: "اكتشف 4 كواكب",
    earned: (ids: string[]) =>
      spaceBodies.filter((body) => body.kind === "planet" && ids.includes(body.id)).length >= 4,
  },
  { icon: Sparkles, name: "حارس النجوم", desc: "اكتشف النجوم", earned: (ids: string[]) => ids.includes("stars") },
  { icon: Moon, name: "رفيق القمر", desc: "اكتشف القمر", earned: (ids: string[]) => ids.includes("moon") },
  {
    icon: Trophy,
    name: "بطل المجموعة الشمسية",
    desc: "أكمل المهمة الرئيسية",
    earned: (ids: string[]) => coreBodies.every((body) => ids.includes(body.id)),
  },
  {
    icon: Rocket,
    name: "رحّال الفضاء",
    desc: "اكتشف كل الأجرام",
    earned: (ids: string[]) => ids.length >= spaceBodies.length,
  },
];

// Positions fixes (pas de hasard au rendu) pour les étoiles du décor.
const backgroundStars = Array.from({ length: 46 }, (_, index) => ({
  top: `${(index * 37 + 11) % 100}%`,
  left: `${(index * 61 + 7) % 100}%`,
  size: 1 + (index % 3),
  delay: `${(index % 7) * -0.5}s`,
}));

function shuffledOrder(length: number) {
  const order = Array.from({ length }, (_, index) => index);
  for (let i = length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function wrongMessage(wrongCount: number, hint: string) {
  if (wrongCount === 1) return "محاولة جميلة! اقرأ السؤال مرة أخرى بتمعّن، ثم جرّب من جديد.";
  if (wrongCount === 2) return `محاولة جميلة! تلميح صغير: ${hint}`;
  if (wrongCount === 3) return `لنفكر معاً. تذكّر: ${hint}`;
  return "لا بأس! أشرت لك إلى الجواب الصحيح. هيا نتعلم معاً.";
}

const iconButton =
  "flex size-10 cursor-pointer items-center justify-center rounded-full border-2 border-white/20 bg-[#161d4d]/80 transition hover:-translate-y-0.5 hover:bg-[#3a2a6b] hover:shadow-[0_0_18px_-4px_#4fe3d0] sm:size-11";

function Modal({
  label,
  sheet = false,
  onClose,
  children,
}: {
  label: string;
  // Feuille en bas d'écran : l'astre reste visible derrière la question.
  sheet?: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`fixed inset-0 z-50 flex justify-center overflow-y-auto p-4 ${
        sheet ? "items-end bg-[#02040d]/30" : "items-center bg-[#02040d]/75"
      }`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`w-full max-w-lg rounded-3xl border-2 border-[#78b4ff]/25 bg-[#0a1236]/95 p-5 text-[#f4f8ff] shadow-2xl sm:p-7 ${
          sheet ? "mt-auto" : "my-auto"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function FeedbackLine({ feedback }: { feedback: Feedback }) {
  const Icon = feedbackIcons[feedback.kind];
  const good = feedback.kind === "success";
  return (
    <p
      role="status"
      className={`mt-4 flex items-start gap-2 rounded-2xl px-4 py-3 text-base font-bold ${
        good ? "bg-[#25c9c0]/20 text-[#9ff5ea]" : "bg-[#ffc857]/15 text-[#ffe2a3]"
      }`}
    >
      <Icon size={20} strokeWidth={2.4} className="mt-0.5 shrink-0" aria-hidden="true" />
      <span>{feedback.text}</span>
      {feedback.awarded ? (
        <Star size={18} className="mt-0.5 shrink-0 fill-[#ffc857] text-[#ffc857]" aria-hidden="true" />
      ) : null}
    </p>
  );
}

export function SpaceGame({ initialAnswered }: { initialAnswered: string[] }) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [answered, setAnswered] = useState(initialAnswered);
  const [active, setActive] = useState<ActiveQuestion | null>(null);
  const [card, setCard] = useState<{ body: SpaceBody; gained: number | null } | null>(null);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [muted, setMuted] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Sans WebGL, on affiche la carte 2D à la place de la scène 3D.
  const [sceneFailed, setSceneFailed] = useState(false);

  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SpaceScene | null>(null);
  const selectFromScene = useRef<(id: string) => void>(() => {});
  const section = useRef<HTMLElement>(null);

  const audio = useRef<AudioContext | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const visitGain = useRef(0);
  const completeShown = useRef(
    coreBodies.every((body) =>
      body.questions.every((_, index) => initialAnswered.includes(spaceQuestionId(body.id, index))),
    ),
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      void audio.current?.close();
    };
  }, []);

  useEffect(() => {
    const element = canvas.current;
    if (!started || !element) return;

    let disposed = false;
    import("@/games/space/scene")
      .then(({ createSpaceScene }) => {
        if (disposed) return;
        scene.current = createSpaceScene(element, (id) => selectFromScene.current(id));
      })
      .catch(() => setSceneFailed(true));

    return () => {
      disposed = true;
      scene.current?.dispose();
      scene.current = null;
    };
  }, [started]);

  const busy = active !== null || card !== null || overlay !== null;
  useEffect(() => {
    scene.current?.setInteractive(!busy);
  }, [busy]);

  const later = useCallback((callback: () => void, delay: number) => {
    timers.current.push(setTimeout(callback, delay));
  }, []);

  function play(notes: number[]) {
    if (muted || typeof window.AudioContext === "undefined") return;
    const context = (audio.current ??= new window.AudioContext());
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + index * 0.12;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.1, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  }

  function showToast(message: string) {
    setToast(message);
    later(() => setToast(null), 2600);
  }

  const answeredCount = (body: SpaceBody, list = answered) =>
    body.questions.filter((_, index) => list.includes(spaceQuestionId(body.id, index))).length;
  const isDiscovered = (body: SpaceBody, list = answered) =>
    answeredCount(body, list) === body.questions.length;
  const discoveredIds = spaceBodies.filter((body) => isDiscovered(body)).map((body) => body.id);

  function openQuestion(body: SpaceBody, list: string[]) {
    const questionIndex = body.questions.findIndex(
      (_, index) => !list.includes(spaceQuestionId(body.id, index)),
    );
    setActive({
      body,
      questionIndex,
      order: shuffledOrder(body.questions[questionIndex].options.length),
      wrongCount: 0,
      feedback: null,
      status: "open",
    });
  }

  function selectBody(body: SpaceBody) {
    play([523]);
    scene.current?.focusOn(body.id);
    section.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (isDiscovered(body)) {
      setCard({ body, gained: null });
      return;
    }
    visitGain.current = 0;
    openQuestion(body, answered);
  }

  useEffect(() => {
    selectFromScene.current = (id) => {
      const body = spaceBodies.find((spaceBody) => spaceBody.id === id);
      if (body) selectBody(body);
    };
  });

  function leaveQuestion() {
    setActive(null);
    scene.current?.goHome();
  }

  async function choose(optionIndex: number) {
    if (!active || active.status !== "open") return;
    const { body, questionIndex } = active;
    const question = body.questions[questionIndex];

    if (optionIndex !== question.answer) {
      play([220, 196]);
      const wrongCount = active.wrongCount + 1;
      setActive({
        ...active,
        wrongCount,
        feedback: { kind: "wrong", text: wrongMessage(wrongCount, question.hint) },
      });
      return;
    }

    setActive({ ...active, status: "saving" });
    try {
      const response = await fetch("/api/games/space/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bodyId: body.id, questionIndex, answer: optionIndex }),
      });
      const result: unknown = await response.json();
      if (
        !response.ok ||
        typeof result !== "object" ||
        result === null ||
        !("correct" in result) ||
        result.correct !== true
      ) {
        throw new Error("answer not saved");
      }

      const awarded = "awarded" in result && result.awarded === true;
      const questionId = spaceQuestionId(body.id, questionIndex);
      const nextAnswered = answered.includes(questionId) ? answered : [...answered, questionId];
      if (awarded) visitGain.current += 1;

      play([523, 659, 784]);
      setAnswered(nextAnswered);
      setActive({
        ...active,
        status: "solved",
        feedback: {
          kind: "success",
          text: awarded ? "أحسنت! إجابة صحيحة: +1 نقطة" : "أحسنت! إجابة صحيحة.",
          awarded,
        },
      });
      // Met à jour le total de points affiché dans l'en-tête du tableau de bord.
      router.refresh();

      later(() => {
        if (isDiscovered(body, nextAnswered)) {
          setActive(null);
          setCard({ body, gained: visitGain.current });
          scene.current?.burst(body.id);
          play([659, 784, 988, 1175]);
        } else {
          openQuestion(body, nextAnswered);
        }
      }, 1300);
    } catch {
      setActive({
        ...active,
        status: "open",
        feedback: { kind: "error", text: "تعذّر حفظ إجابتك. تحقّق من الإنترنت وحاول مرة أخرى!" },
      });
    }
  }

  function closeCard() {
    setCard(null);
    scene.current?.goHome();
    if (!completeShown.current && coreBodies.every((body) => isDiscovered(body))) {
      completeShown.current = true;
      later(() => {
        setOverlay("complete");
        play([523, 659, 784, 1047]);
      }, 500);
    }
  }

  function discoverMore() {
    const next = spaceBodies.find((body) => !isDiscovered(body));
    closeCard();
    showToast(next ? "هناك أجرام أخرى تنتظرك. اضغط على جسم مضيء!" : "لقد اكتشفت كل الأجرام!");
  }

  const hud = (
    <div className="flex flex-wrap items-center gap-2">
      <p className="flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-[#161d4d]/80 px-3 py-1.5 text-base font-bold sm:px-4 sm:py-2">
        <Star size={18} className="fill-[#ffc857] text-[#ffc857]" aria-hidden="true" /> {answered.length}/{totalSpaceQuestions}
        <span className="sr-only"> نقطة في هذه اللعبة</span>
      </p>
      <p className="flex items-center gap-1.5 rounded-full border-2 border-white/20 bg-[#161d4d]/80 px-3 py-1.5 text-base font-bold sm:px-4 sm:py-2">
        <Orbit size={18} className="text-[#4fe3d0]" aria-hidden="true" /> {discoveredIds.length}/{spaceBodies.length}
        <span className="sr-only"> اكتشاف</span>
      </p>
      <div className="flex-1" />
      <button
        type="button"
        className={iconButton}
        aria-label="عرض المجموعة الشمسية"
        onClick={() => scene.current?.goHome()}
      >
        <House size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={iconButton}
        aria-label="مجموعة الاكتشافات"
        onClick={() => setOverlay("collection")}
      >
        <BookOpen size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={iconButton}
        aria-label={muted ? "تشغيل الصوت" : "إيقاف الصوت"}
        onClick={() => setMuted(!muted)}
      >
        {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
      </button>
      <button
        type="button"
        className={iconButton}
        aria-label="كيف ألعب؟"
        onClick={() => setOverlay("help")}
      >
        <CircleHelp size={20} aria-hidden="true" />
      </button>
    </div>
  );

  const question = active ? active.body.questions[active.questionIndex] : null;
  const revealAnswer = active !== null && active.wrongCount >= 4;

  return (
    <section
      ref={section}
      dir="rtl"
      className="relative scroll-mt-24 overflow-hidden rounded-3xl p-2 text-[#f4f8ff] shadow-xl sm:p-4 md:scroll-mt-4"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #1a2358 0%, #0c1233 45%, #05081c 100%)",
        minHeight: "70dvh",
      }}
    >
      {backgroundStars.map((star, index) => (
        <span
          key={index}
          aria-hidden="true"
          className="pointer-events-none absolute rounded-full bg-white/80 motion-safe:animate-pulse"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
          }}
        />
      ))}

      {!started ? (
        <div className="relative flex min-h-[62dvh] flex-col items-center justify-center gap-4 text-center">
          <div className="wz-bob flex items-end gap-4">
            <IconTile icon={Rocket} tone="#3a8ee6" size="xl" />
            <IconTile icon={Telescope} tone="#7c5ce6" size="lg" />
          </div>
          <p className="max-w-md rounded-3xl border-2 border-[#78b4ff]/25 bg-[#161d4d]/80 px-5 py-3 text-lg">
            مرحباً أيها المستكشف الصغير! هل أنت مستعد لرحلة مذهلة بين الكواكب والنجوم؟
          </p>
          <h1 className="bg-linear-to-l from-[#4fe3d0] via-[#ffc857] to-[#f4f8ff] bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
            الرائد الصغير — رحلة إلى الفضاء
          </h1>
          <p className="max-w-md text-lg text-[#a9b8dd]">
            انظر عبر التلسكوب السحري واكتشف أسرار الشمس والكواكب والنجوم. كل إجابة صحيحة تمنحك نقطة!
          </p>
          <Button
            variant="gold"
            size="lg"
            icon={Rocket}
            onClick={() => {
              setStarted(true);
              play([392, 523, 659]);
            }}
          >
            ابدأ مغامرتي الفضائية
          </Button>
        </div>
      ) : (
        <div className="relative">

          {sceneFailed ? (
            <>
              {hud}
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-lg text-[#a9b8dd]">
                اضغط على أي جسم مضيء لتكتشف سرّه
                <Sparkles size={18} className="text-[#ffc857]" aria-hidden="true" />
              </p>

              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {spaceBodies.map((body, index) => {
                  const discovered = isDiscovered(body);
                  return (
                    <li key={body.id}>
                      <button
                        type="button"
                        onClick={() => selectBody(body)}
                        aria-label={discovered ? body.name : "جسم غامض، اضغط لتكتشفه"}
                        className="flex h-40 w-full cursor-pointer flex-col items-center justify-between rounded-3xl border-2 border-transparent p-2 transition hover:border-[#4fe3d0]/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-[#4fe3d0]"
                      >
                        <span
                          className="flex h-24 items-center justify-center motion-safe:animate-float"
                          style={{ animationDelay: `${index * -0.6}s` }}
                        >
                          <SpaceBodyVisual body={body} scale={0.9} />
                        </span>
                        <span className="text-base font-bold">{discovered ? body.name : "؟؟؟"}</span>
                        <span aria-hidden="true" className="flex gap-1">
                          {body.questions.map((_, questionIndex) => (
                            <span
                              key={questionIndex}
                              className={`size-2.5 rounded-full ${
                                questionIndex < answeredCount(body) ? "bg-[#ffc857]" : "bg-white/25"
                              }`}
                            />
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <>
              <div className="relative h-[62dvh] min-h-80 overflow-hidden rounded-3xl border-2 border-[#78b4ff]/20">
                <canvas
                  ref={canvas}
                  aria-label="المجموعة الشمسية بالأبعاد الثلاثية"
                  className="absolute inset-0 size-full cursor-grab touch-none"
                />
                <div className="absolute inset-x-2 top-2">{hud}</div>
                <p className="pointer-events-none absolute inset-x-3 bottom-3 mx-auto flex w-fit items-center gap-2 rounded-full bg-[#0a1236]/80 px-4 py-2 text-center text-base text-[#a9b8dd]">
                  <Sparkles size={16} className="shrink-0 text-[#ffc857]" aria-hidden="true" />
                  اضغط على أي جسم مضيء لتكتشف سرّه، واسحب لتدور في الفضاء
                </p>
              </div>

              <ul className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {spaceBodies.map((body) => {
                  const discovered = isDiscovered(body);
                  return (
                    <li key={body.id} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => selectBody(body)}
                        aria-label={discovered ? body.name : "جسم غامض، اضغط لتكتشفه"}
                        className="flex h-24 w-20 cursor-pointer flex-col items-center justify-between rounded-2xl border-2 border-white/15 bg-[#161d4d]/70 p-2 transition hover:border-[#4fe3d0]/70 focus-visible:outline-2 focus-visible:outline-[#4fe3d0]"
                      >
                        <span className="flex h-10 items-center justify-center">
                          <SpaceBodyVisual body={body} scale={0.36} />
                        </span>
                        <span className="text-base font-bold leading-none">
                          {discovered ? body.name : "؟؟؟"}
                        </span>
                        <span aria-hidden="true" className="flex gap-1">
                          {body.questions.map((_, questionIndex) => (
                            <span
                              key={questionIndex}
                              className={`size-2 rounded-full ${
                                questionIndex < answeredCount(body) ? "bg-[#ffc857]" : "bg-white/25"
                              }`}
                            />
                          ))}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}

      {toast ? (
        <p
          role="status"
          className="fixed inset-x-4 bottom-6 z-50 mx-auto flex w-fit max-w-full items-center gap-2 rounded-full bg-[#161d4d] px-5 py-3 text-center text-base font-bold text-[#f4f8ff] shadow-xl"
        >
          <Telescope size={20} className="shrink-0 text-[#4fe3d0]" aria-hidden="true" />
          {toast}
        </p>
      ) : null}

      {active && question ? (
        <Modal label="سؤال" sheet onClose={() => active.status === "open" && leaveQuestion()}>
          <p className="flex items-center gap-2 text-base text-[#a9b8dd]">
            <Telescope size={20} className="shrink-0 text-[#4fe3d0]" aria-hidden="true" />
            جسم غامض يريد أن يعرّفك بنفسه ({active.questionIndex + 1}/{active.body.questions.length})
          </p>
          <p className="mt-3 text-xl font-extrabold leading-relaxed">{question.q}</p>
          <div className="mt-4 flex flex-col gap-2">
            {active.order.map((optionIndex, position) => {
              const isAnswer = optionIndex === question.answer;
              const highlight =
                isAnswer && active.status === "solved"
                  ? "border-[#4fe3d0] bg-[#25c9c0]/25"
                  : isAnswer && revealAnswer
                    ? "border-[#ffc857] bg-[#ffc857]/15"
                    : "border-white/20 bg-[#161d4d]/80 hover:border-[#4fe3d0]/70";
              return (
                <button
                  key={optionIndex}
                  type="button"
                  disabled={active.status !== "open"}
                  onClick={() => choose(optionIndex)}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-2 text-start text-lg font-bold transition disabled:cursor-default ${highlight}`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#3a2a6b] text-base">
                    {letters[position]}
                  </span>
                  {question.options[optionIndex]}
                </button>
              );
            })}
          </div>
          {active.feedback ? (
            <FeedbackLine feedback={active.feedback} />
          ) : null}
          <div className="mt-4 flex flex-wrap justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Lightbulb}
              iconPosition="start"
              disabled={active.status !== "open"}
              onClick={() => setActive({ ...active, feedback: { kind: "hint", text: question.hint } })}
            >
              أعطني تلميحاً
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Undo2}
              iconPosition="start"
              disabled={active.status !== "open"}
              onClick={leaveQuestion}
            >
              العودة إلى الفضاء
            </Button>
          </div>
        </Modal>
      ) : null}

      {card ? (
        <Modal label={card.body.name} onClose={closeCard}>
          <div className="flex h-36 items-center justify-center">
            <SpaceBodyVisual body={card.body} scale={1.3} />
          </div>
          <h2 className="mt-2 text-center text-3xl font-black text-[#ffc857]">
            {card.body.name}
          </h2>
          <p className="mt-2 text-center text-lg">{card.body.desc}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {card.body.facts.map((fact) => (
              <li key={fact} className="flex gap-2 rounded-2xl bg-[#161d4d]/80 px-4 py-2 text-base">
                <Sparkles size={18} className="mt-1 shrink-0 text-[#ffc857]" aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
          {card.gained ? (
            <p className="mx-auto mt-4 flex w-fit items-center gap-2 rounded-full bg-[#ffc857]/20 px-5 py-2 text-lg font-extrabold text-[#ffc857]">
              <Star size={20} className="fill-[#ffc857]" aria-hidden="true" />+{card.gained} نقطة
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Button variant="gold" icon={Sparkles} onClick={discoverMore}>
              اكتشف المزيد
            </Button>
            <Button variant="ghost" icon={Undo2} iconPosition="start" onClick={closeCard}>
              العودة إلى الفضاء
            </Button>
          </div>
        </Modal>
      ) : null}

      {overlay === "collection" ? (
        <Modal label="مجموعة الاكتشافات" onClose={() => setOverlay(null)}>
          <h2 className="flex items-center gap-2 text-2xl font-black text-[#ffc857]">
            <BookOpen size={26} aria-hidden="true" />
            مجموعة الاكتشافات
          </h2>
          <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {spaceBodies.map((body) => {
              const discovered = isDiscovered(body);
              return (
                <li
                  key={body.id}
                  className={`rounded-2xl bg-[#161d4d]/80 p-2 text-center text-base font-bold ${
                    discovered ? "" : "opacity-45"
                  }`}
                >
                  <span aria-hidden="true" className="flex h-12 items-center justify-center">
                    {discovered ? (
                      <SpaceBodyVisual body={body} scale={0.36} />
                    ) : (
                      <CircleHelp size={30} className="text-[#a9b8dd]" />
                    )}
                  </span>
                  {discovered ? body.name : "؟؟؟"}
                </li>
              );
            })}
          </ul>
          <h3 className="mt-5 text-xl font-extrabold">الأوسمة</h3>
          <ul className="mt-2 flex flex-col gap-2">
            {badges.map((badge) => {
              const earned = badge.earned(discoveredIds);
              return (
                <li
                  key={badge.name}
                  className={`flex items-center gap-3 rounded-2xl bg-[#161d4d]/80 px-4 py-2 ${
                    earned ? "" : "opacity-45"
                  }`}
                >
                  {earned ? (
                    <IconTile icon={badge.icon} tone="#e5a400" size="sm" />
                  ) : (
                    <IconTile icon={Lock} tone="#5b6788" size="sm" />
                  )}
                  <span>
                    <span className="block text-base font-bold">{badge.name}</span>
                    <span className="block text-base text-[#a9b8dd]">{badge.desc}</span>
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-5 text-center">
            <Button variant="ghost" onClick={() => setOverlay(null)}>
              إغلاق
            </Button>
          </div>
        </Modal>
      ) : null}

      {overlay === "help" ? (
        <Modal label="كيف ألعب؟" onClose={() => setOverlay(null)}>
          <h2 className="flex items-center gap-2 text-2xl font-black text-[#ffc857]">
            <CircleHelp size={26} aria-hidden="true" />
            كيف ألعب؟
          </h2>
          <ol className="mt-4 flex flex-col gap-2 text-lg">
            <li>1. اضغط على أي جسم مضيء في الفضاء.</li>
            <li>2. اقرأ السؤال واختر الجواب الصحيح.</li>
            <li className="flex items-center gap-1.5">
              3. كل إجابة صحيحة تمنحك نقطة واحدة
              <Star size={18} className="fill-[#ffc857] text-[#ffc857]" aria-hidden="true" />
            </li>
            <li>4. أجب عن سؤالَي كل جرم لتكتشفه وتقرأ أسراره.</li>
          </ol>
          <p className="mt-3 flex items-center gap-1.5 text-base text-[#a9b8dd]">
            إذا أخطأت فلا بأس: جرّب من جديد أو اطلب تلميحاً
            <Lightbulb size={18} className="text-[#ffc857]" aria-hidden="true" />
          </p>
          <div className="mt-5 text-center">
            <Button variant="gold" onClick={() => setOverlay(null)}>
              فهمت!
            </Button>
          </div>
        </Modal>
      ) : null}

      {overlay === "complete" ? (
        <Modal label="أكملت المهمة" onClose={() => setOverlay(null)}>
          <div className="flex justify-center">
            <IconTile icon={Trophy} tone="#e5a400" size="xl" className="wz-bob" />
          </div>
          <h2 className="mt-2 text-center text-3xl font-black text-[#ffc857]">
            أحسنت يا بطل المجموعة الشمسية!
          </h2>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-center text-lg">
            اكتشفت الشمس والقمر وكل الكواكب. جمعت {answered.length} نقطة في هذه الرحلة
            <Star size={18} className="fill-[#ffc857] text-[#ffc857]" aria-hidden="true" />
          </p>
          <div className="mt-5 text-center">
            <Button variant="gold" icon={Rocket} onClick={() => setOverlay(null)}>
              أواصل الاستكشاف
            </Button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
