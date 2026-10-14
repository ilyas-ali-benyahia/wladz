"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Component,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MOVEMENT_KEYS, clearInput, createInput } from "./input";
import type { Phase } from "./Scene";
import {
  CHOICES,
  INTRO_BEATS,
  SPEAKER_NAMES,
  type ActorId,
  type Anim,
  type Choice,
} from "./story";
import styles from "./OneChoice.module.css";
import { Joystick, LookZone } from "./TouchControls";

// three.js touches window/document at import time: load it on the client only.
const Scene = dynamic(() => import("./Scene"), { ssr: false });

type GLStatus = "checking" | "ok" | "unsupported" | "failed";

class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const PLAYING: Phase[] = ["explore", "dialogue", "outcome"];

export default function OneChoiceGame({ exitHref = "/" }: { exitHref?: string }) {
  const [input] = useState(createInput);
  const stageRef = useRef<HTMLDivElement>(null);

  const [gl, setGl] = useState<GLStatus>("checking");
  const [ready, setReady] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [paused, setPaused] = useState(false);
  const [near, setNear] = useState(false);
  const [runId, setRunId] = useState(0);
  const [choice, setChoice] = useState<Choice | null>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [hint, setHint] = useState(false);

  const script = choice ? choice.beats : INTRO_BEATS;
  const beat = script[Math.min(beatIndex, script.length - 1)];
  const awaitingChoice = phase === "dialogue" && !!beat.awaitChoice;

  // ---------- environment detection (client only, after hydration) ----------
  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const id = requestAnimationFrame(() => {
      setIsTouch(coarse || (navigator.maxTouchPoints > 0 && !window.matchMedia("(hover: hover)").matches));
      setGl(hasWebGL() ? "ok" : "unsupported");
    });
    // Hybrid devices: follow whatever the player is actually using.
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") setIsTouch(true);
      else if (e.pointerType === "mouse") setIsTouch(false);
    };
    window.addEventListener("pointerdown", onPointer, { capture: true, passive: true });
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("pointerdown", onPointer, { capture: true });
    };
  }, []);

  // Stop the page behind the game from scrolling / rubber-banding.
  useEffect(() => {
    const html = document.documentElement;
    const prev = [document.body.style.overflow, html.style.overscrollBehavior];
    document.body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = prev[0];
      html.style.overscrollBehavior = prev[1];
    };
  }, []);

  // ---------- actions ----------
  const requestLock = useCallback(() => {
    const el = stageRef.current;
    if (isTouch || !el || !el.requestPointerLock || document.pointerLockElement) return;
    try {
      const r = el.requestPointerLock() as unknown as Promise<void> | undefined;
      r?.catch?.(() => {});
    } catch {
      /* pointer lock is optional; drag-to-look still works */
    }
  }, [isTouch]);

  const showHint = useCallback(() => setHint(true), []);

  const start = useCallback(() => {
    clearInput(input);
    setPhase("explore");
    showHint();
    requestLock();
  }, [input, requestLock, showHint]);

  const restart = useCallback(() => {
    clearInput(input);
    setChoice(null);
    setBeatIndex(0);
    setNear(false);
    setPaused(false);
    setRunId((r) => r + 1);
    setPhase("explore");
    showHint();
    requestLock();
  }, [input, requestLock, showHint]);

  const interact = useCallback(() => {
    if (phase !== "explore" || !near || paused) return;
    clearInput(input);
    setChoice(null);
    setBeatIndex(0);
    setPhase("dialogue");
  }, [input, near, phase, paused]);

  const choose = useCallback(
    (c: Choice) => {
      if (!awaitingChoice || paused) return;
      setChoice(c);
      setBeatIndex(0);
      setPhase("outcome");
    },
    [awaitingChoice, paused],
  );

  const advance = useCallback(() => {
    if (paused || beat.awaitChoice) return;
    if (beatIndex < script.length - 1) setBeatIndex((i) => i + 1);
    else if (phase === "outcome") setPhase("complete");
  }, [beat, beatIndex, paused, phase, script.length]);

  const pause = useCallback(() => {
    clearInput(input);
    setPaused(true);
  }, [input]);

  const resume = useCallback(() => {
    setPaused(false);
    if (phase === "explore") requestLock();
  }, [phase, requestLock]);

  // ---------- timers ----------
  useEffect(() => {
    if (paused || (phase !== "dialogue" && phase !== "outcome") || beat.awaitChoice) return;
    const id = window.setTimeout(advance, beat.duration * 1000);
    return () => window.clearTimeout(id);
  }, [advance, beat, paused, phase]);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(false), 7000);
    return () => window.clearTimeout(id);
  }, [hint, runId]);

  // Release the mouse when the conversation starts so options can be clicked.
  useEffect(() => {
    if (phase !== "explore" && document.pointerLockElement) document.exitPointerLock();
  }, [phase]);

  // ---------- global listeners (bound once, read latest state via ref) ----------
  const latest = useRef({ phase, paused, awaitingChoice, interact, choose, advance, pause, resume });
  useEffect(() => {
    latest.current = { phase, paused, awaitingChoice, interact, choose, advance, pause, resume };
  });

  useEffect(() => {
    let unlockedAt = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      const s = latest.current;
      const playing = PLAYING.includes(s.phase);

      if (e.code === "Escape") {
        if (!playing) return;
        e.preventDefault();
        // Escape that just released pointer lock already paused the game.
        if (performance.now() - unlockedAt < 250) return;
        if (s.paused) s.resume();
        else s.pause();
        return;
      }
      if (s.paused || !playing) return;

      if (s.phase === "explore") {
        if (MOVEMENT_KEYS.has(e.code)) {
          e.preventDefault();
          input.keys.add(e.code);
        } else if (e.code === "KeyE" && !e.repeat) {
          s.interact();
        }
        return;
      }
      if (s.awaitingChoice && /^(Digit|Numpad)[1-4]$/.test(e.code)) {
        e.preventDefault();
        s.choose(CHOICES[Number(e.code.slice(-1)) - 1]);
        return;
      }
      if ((e.code === "Space" || e.code === "Enter") && !e.repeat && target?.tagName !== "BUTTON") {
        e.preventDefault();
        s.advance();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      input.keys.delete(e.code);
    };
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === stageRef.current;
      setLocked(isLocked);
      const s = latest.current;
      if (!isLocked && s.phase === "explore" && !s.paused) {
        unlockedAt = performance.now();
        s.pause();
      }
    };
    const onBlur = () => {
      clearInput(input);
      const s = latest.current;
      if (PLAYING.includes(s.phase) && !s.paused) s.pause();
    };
    const onVisibility = () => {
      if (document.hidden) onBlur();
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("pointerlockchange", onLockChange);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("pointerlockchange", onLockChange);
      if (document.pointerLockElement) document.exitPointerLock();
      clearInput(input);
    };
  }, [input]);

  // ---------- scene props ----------
  const anims = useMemo(() => {
    const base: Record<ActorId, Anim> = { player: "idle", yacine: "idle", amel: "idle", karim: "idle" };
    if (phase === "intro" || phase === "explore") return base;
    const a = { ...base, ...beat.anims };
    if (phase === "complete" && a.player === "walkAway") a.player = "idle";
    return a;
  }, [beat, phase]);

  const onReady = useCallback(() => setReady(true), []);
  const onFail = useCallback(() => setGl("failed"), []);

  const dim = (phase === "outcome" && beat.mood === "dim") || (phase === "complete" && choice?.id === 2);
  const loading = gl === "checking" || (gl === "ok" && !ready);

  return (
    <div className={styles.root}>
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && phase === "explore" && !paused) requestLock();
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || phase !== "explore" || paused) return;
          if (document.pointerLockElement === stageRef.current || e.buttons & 1) {
            input.look.dx += e.movementX;
            input.look.dy += e.movementY;
          }
        }}
      >
        {gl === "ok" && (
          <SceneBoundary onError={onFail}>
            <Scene
              phase={phase}
              paused={paused}
              runId={runId}
              input={input}
              anims={anims}
              lowPower={isTouch}
              onNearChange={setNear}
              onReady={onReady}
              onContextLost={onFail}
            />
          </SceneBoundary>
        )}
      </div>

      <div className={`${styles.vignette} ${dim ? styles.vignetteOn : ""}`} aria-hidden="true" />

      {/* ---------- HUD ---------- */}
      {PLAYING.includes(phase) && !paused && (
        <>
          <div className={styles.badge}>
            <span className={styles.badgeBrand}>WlaDZ</span> One Choice
          </div>
          <button type="button" className={styles.pauseBtn} onClick={pause} aria-label="Pause game">
            <span aria-hidden="true">❚❚</span>
          </button>
        </>
      )}

      {phase === "explore" && !paused && (
        <>
          <div className={styles.objective}>
            {near ? "Your friends are here" : "Find your friends by the bench ahead"}
          </div>
          {hint && (
            <div className={styles.hint}>
              {isTouch
                ? "Left stick to walk · drag right side to look"
                : locked
                  ? "WASD to walk · mouse to look · Esc to pause"
                  : "WASD to walk · click the scene, then move the mouse to look"}
            </div>
          )}
          {near && !isTouch && (
            <button type="button" className={styles.prompt} onClick={interact}>
              <kbd>E</kbd> Talk to your friends
            </button>
          )}
          {isTouch && (
            <>
              <LookZone input={input} />
              <Joystick input={input} />
              {near && (
                <button type="button" className={styles.talkBtn} onClick={interact}>
                  Talk
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* ---------- dialogue + outcome ---------- */}
      {(phase === "dialogue" || phase === "outcome") && (
        <section
          className={styles.dialogue}
          aria-label="Conversation"
          onClick={() => !awaitingChoice && advance()}
        >
          {beat.speaker !== "narrator" ? (
            <p className={styles.speaker} data-speaker={beat.speaker}>
              {SPEAKER_NAMES[beat.speaker]}
            </p>
          ) : null}
          <p
            key={`${choice?.id ?? 0}-${beatIndex}`}
            className={beat.speaker === "narrator" ? styles.narration : styles.line}
            aria-live="polite"
          >
            {beat.speaker === "narrator" ? beat.text : `“${beat.text}”`}
          </p>

          {awaitingChoice ? (
            <>
              <p className={styles.ask}>Yacine is holding out something harmful. What do you do?</p>
              <div className={styles.choices}>
                {CHOICES.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={styles.choice}
                    autoFocus={i === 0 && !isTouch}
                    onClick={(e) => {
                      e.stopPropagation();
                      choose(c);
                    }}
                  >
                    <span className={styles.choiceNum}>{c.id}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <button
              type="button"
              className={styles.next}
              onClick={(e) => {
                e.stopPropagation();
                advance();
              }}
            >
              Next ›
            </button>
          )}
        </section>
      )}

      {/* ---------- completion ---------- */}
      {phase === "complete" && choice && (
        <section className={styles.complete} aria-label="Outcome">
          <p className={styles.kicker}>Outcome · {choice.title}</p>
          <p className={styles.message}>{choice.message}</p>
          <p className={styles.sub}>Every choice plays out differently. Try another one.</p>
          <div className={styles.row}>
            <button type="button" className={styles.primary} onClick={restart} autoFocus>
              Play again
            </button>
            <Link href={exitHref} className={styles.secondary}>
              Exit
            </Link>
          </div>
        </section>
      )}

      {/* ---------- intro ---------- */}
      {phase === "intro" && (
        <section className={styles.overlay} aria-label="One Choice">
          <div className={styles.card}>
            <p className={styles.kicker}>WlaDZ · Game 01</p>
            <h1 className={styles.title}>One Choice</h1>
            <p className={styles.intro}>
              You&apos;re meeting three friends at the neighbourhood park. One of them has an idea
              you&apos;re not sure about. You have one choice — make it yours.
            </p>
            <Controls isTouch={isTouch} />
            {gl === "unsupported" || gl === "failed" ? (
              <p className={styles.error} role="alert">
                {gl === "unsupported"
                  ? "Your browser or device doesn't support 3D graphics (WebGL), so this game can't run here. Try an up-to-date Chrome, Firefox, Safari or Edge."
                  : "The 3D scene couldn't start. Reload the page to try again."}
              </p>
            ) : (
              <button type="button" className={styles.primary} onClick={start} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" /> Loading the park…
                  </>
                ) : (
                  "Start"
                )}
              </button>
            )}
            <p className={styles.meta}>About 1 minute · Ages 13–17</p>
          </div>
        </section>
      )}

      {/* ---------- pause ---------- */}
      {paused && PLAYING.includes(phase) && (
        <section className={styles.overlay} aria-label="Paused">
          <div className={styles.card}>
            <h2 className={styles.pausedTitle}>Paused</h2>
            <Controls isTouch={isTouch} />
            <div className={styles.stack}>
              <button type="button" className={styles.primary} onClick={resume} autoFocus>
                Resume
              </button>
              <button type="button" className={styles.secondary} onClick={restart}>
                Restart
              </button>
              <Link href={exitHref} className={styles.ghost}>
                Exit game
              </Link>
            </div>
          </div>
        </section>
      )}

      {gl === "failed" && phase !== "intro" && (
        <section className={styles.overlay} role="alert">
          <div className={styles.card}>
            <p className={styles.error}>The 3D scene stopped unexpectedly. Reload the page to play again.</p>
            <button type="button" className={styles.primary} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

function Controls({ isTouch }: { isTouch: boolean }) {
  const rows: [string, string][] = isTouch
    ? [
        ["Left stick", "Walk"],
        ["Drag right side", "Look around"],
        ["Talk button", "Talk to friends"],
        ["Tap", "Choose a response"],
      ]
    : [
        ["W A S D / Arrows", "Walk"],
        ["Mouse", "Look around"],
        ["E", "Talk to friends"],
        ["Click or 1–4", "Choose a response"],
        ["Esc", "Pause"],
      ];
  return (
    <dl className={styles.controls}>
      {rows.map(([k, v]) => (
        <div key={k} className={styles.controlRow}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
