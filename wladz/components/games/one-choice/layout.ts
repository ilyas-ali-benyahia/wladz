// World layout shared by the environment (what is drawn) and gameplay
// (where you can walk). Units are metres; +z points toward the player's start.

export type V3 = [number, number, number];

export const PARK_HALF = 21; // park is 42 x 42 m
export const WALK_LIMIT = 20.2;

export const PLAYER_START: V3 = [0, 0, 17];
export const PLAYER_START_ROT = Math.PI; // facing -z, toward the friends

/** Where the player stands during the conversation. */
export const TALK_SPOT: V3 = [0, 0, -10.6];
export const INTERACT_RADIUS = 3.6;

export const NPC_POSITIONS: Record<"yacine" | "amel" | "karim", V3> = {
  yacine: [0.15, 0, -12.5],
  amel: [-1.5, 0, -13.4],
  karim: [1.6, 0, -13.6],
};

export const GROUP_CENTER: V3 = [0.1, 0, -13.2];

export const FOUNTAIN = { x: 0, z: 0, r: 2.6 };

export const TREES: [number, number, number][] = [
  // x, z, scale
  [-15, -15, 1.1],
  [-9, -17.5, 0.95],
  [-16.5, -7, 1.0],
  [-8, -8.5, 0.85],
  [-17, 8, 1.15],
  [-9, 14.5, 1.0],
  [-15.5, 16.5, 0.9],
  [-8, 7.8, 0.9],
  [8, 8, 0.95],
  [15.5, 9, 1.1],
  [9, 16, 0.9],
  [16.5, 16.5, 1.05],
  [18, -18.5, 1.0],
  [6.5, -17.5, 0.9],
  [-19, -19, 0.95],
  [-19, 0.5, 0.8],
];

export const PALMS: [number, number, number][] = [
  [-2.7, 18.5, 1.0],
  [2.7, 18.5, 1.05],
  [-2.7, 10, 0.95],
  [2.7, 10, 1.0],
  [-2.7, -19, 1.0],
  [2.7, -19, 0.95],
  [-9.5, 2.7, 1.0],
  [-15, -2.7, 0.9],
  [15, 2.7, 1.0],
];

/** x, z, rotationY. Benches face +z before rotation. */
export const BENCHES: [number, number, number][] = [
  [0, -16.4, 0],
  [-3.6, -15.7, Math.PI / 5],
  [-10.5, 2.5, Math.PI],
  [-10.5, -2.5, 0],
  [10.5, 2.5, Math.PI],
  [-3.4, 9, Math.PI / 2],
  [3.4, 13.5, -Math.PI / 2],
];

export const LAMPS: [number, number][] = [
  [-2.4, 13.5],
  [2.4, 13.5],
  [2.6, -11.2],
  [-2.6, -10.2],
  [-5.2, 5.2],
  [5.2, 5.2],
  [-5.2, -5.2],
  [5.2, -5.2],
  [-13, 1.9],
  [13, -1.9],
];

/** Small football court (center x, z, half width, half depth). */
export const COURT = { x: 14.2, z: -10.5, hw: 4.6, hd: 6.6 };

export type Circle = { x: number; z: number; r: number };

export const COLLIDERS: Circle[] = [
  { x: FOUNTAIN.x, z: FOUNTAIN.z, r: FOUNTAIN.r + 0.45 },
  ...TREES.map(([x, z, s]) => ({ x, z, r: 0.55 * s })),
  ...PALMS.map(([x, z]) => ({ x, z, r: 0.4 })),
  ...LAMPS.map(([x, z]) => ({ x, z, r: 0.25 })),
  ...BENCHES.map(([x, z]) => ({ x, z, r: 0.95 })),
  ...Object.values(NPC_POSITIONS).map(([x, , z]) => ({ x, z, r: 0.5 })),
];

/** Pushes a point out of every collider and keeps it inside the park. */
export function resolveCollisions(pos: { x: number; z: number }, radius = 0.35) {
  for (const c of COLLIDERS) {
    const dx = pos.x - c.x;
    const dz = pos.z - c.z;
    const min = c.r + radius;
    const d2 = dx * dx + dz * dz;
    if (d2 < min * min) {
      const d = Math.sqrt(d2) || 0.0001;
      pos.x = c.x + (dx / d) * min;
      pos.z = c.z + (dz / d) * min;
    }
  }
  pos.x = Math.max(-WALK_LIMIT, Math.min(WALK_LIMIT, pos.x));
  pos.z = Math.max(-WALK_LIMIT, Math.min(WALK_LIMIT, pos.z));
}

/** Rotates a local (x, z) offset by angle around Y and adds an origin. */
export function placeLocal(
  ox: number,
  oz: number,
  rotY: number,
  lx: number,
  ly: number,
  lz: number,
): V3 {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  return [ox + lx * c + lz * s, ly, oz - lx * s + lz * c];
}
