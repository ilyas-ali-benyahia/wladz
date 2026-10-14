// Mutable input state shared between DOM event handlers and the render loop.
// Kept outside React state on purpose: it changes every frame / pointer move.

export type InputState = {
  /** Currently pressed keys (KeyboardEvent.code). */
  keys: Set<string>;
  /** Virtual joystick, -1..1. y > 0 means forward. */
  joy: { x: number; y: number };
  /** Accumulated look delta in pixels since the last frame. */
  look: { dx: number; dy: number };
};

export function createInput(): InputState {
  return { keys: new Set(), joy: { x: 0, y: 0 }, look: { dx: 0, dy: 0 } };
}

export function clearInput(input: InputState) {
  input.keys.clear();
  input.joy.x = 0;
  input.joy.y = 0;
  input.look.dx = 0;
  input.look.dy = 0;
}

/** Movement vector from keyboard + joystick. x = right, y = forward. Length ≤ 1. */
export function readMove(input: InputState): { x: number; y: number } {
  const k = input.keys;
  let x =
    (k.has("KeyD") || k.has("ArrowRight") ? 1 : 0) -
    (k.has("KeyA") || k.has("ArrowLeft") ? 1 : 0);
  let y =
    (k.has("KeyW") || k.has("ArrowUp") ? 1 : 0) -
    (k.has("KeyS") || k.has("ArrowDown") ? 1 : 0);
  x += input.joy.x;
  y += input.joy.y;
  const len = Math.hypot(x, y);
  if (len > 1) {
    x /= len;
    y /= len;
  }
  return { x, y };
}

export const MOVEMENT_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);
