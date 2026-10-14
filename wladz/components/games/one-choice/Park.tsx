"use client";

import { useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import {
  BENCHES,
  COURT,
  FOUNTAIN,
  LAMPS,
  PALMS,
  PARK_HALF,
  TREES,
  placeLocal,
  type V3,
} from "./layout";

type Item = { p: V3; r?: V3; s?: V3 | number; c?: string };

/** One draw call for many copies of the same mesh. */
function Inst({
  items,
  children,
  castShadow = false,
  receiveShadow = false,
}: {
  items: Item[];
  children: ReactNode;
  castShadow?: boolean;
  receiveShadow?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      p.set(...it.p);
      const [rx, ry, rz] = it.r ?? [0, 0, 0];
      e.set(rx, ry, rz, "YXZ"); // yaw last, so tilts happen in the item's own frame
      q.setFromEuler(e);
      if (typeof it.s === "number" || it.s === undefined) s.setScalar(it.s ?? 1);
      else s.set(...it.s);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      if (it.c) mesh.setColorAt(i, col.set(it.c));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
    >
      {children}
    </instancedMesh>
  );
}

// Deterministic pseudo-random so the city looks the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

const SKY_TOP = new THREE.Color("#5b7bb4");
const SKY_HORIZON = new THREE.Color("#f2c193");
export const FOG_COLOR = "#e6bf9a";

function Sky() {
  const uniforms = useMemo(
    () => ({ top: { value: SKY_TOP }, horizon: { value: SKY_HORIZON } }),
    [],
  );
  return (
    <mesh scale={160} renderOrder={-1}>
      <sphereGeometry args={[1, 24, 12]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }`}
        fragmentShader={`
          uniform vec3 top;
          uniform vec3 horizon;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            gl_FragColor = vec4(mix(horizon, top, pow(smoothstep(0.0, 0.6, h), 0.8)), 1.0);
            #include <colorspace_fragment>
          }`}
      />
    </mesh>
  );
}

function Ground() {
  return (
    <group>
      {/* street */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#4a4c50" roughness={1} />
      </mesh>
      {/* sidewalk ring */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.03} receiveShadow>
        <planeGeometry args={[PARK_HALF * 2 + 5, PARK_HALF * 2 + 5]} />
        <meshStandardMaterial color="#cfc6b6" roughness={1} />
      </mesh>
      {/* grass */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.05} receiveShadow>
        <planeGeometry args={[PARK_HALF * 2, PARK_HALF * 2]} />
        <meshStandardMaterial color="#6f8f45" roughness={1} />
      </mesh>
      {/* paths */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.06} receiveShadow>
        <planeGeometry args={[3.2, PARK_HALF * 2]} />
        <meshStandardMaterial color="#d9c9a8" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.061} receiveShadow>
        <planeGeometry args={[PARK_HALF * 2, 3.2]} />
        <meshStandardMaterial color="#d9c9a8" roughness={1} />
      </mesh>
      {/* plaza + small square where the friends hang out */}
      <mesh rotation-x={-Math.PI / 2} position-y={0.065} receiveShadow>
        <circleGeometry args={[6.2, 40]} />
        <meshStandardMaterial color="#e3d4b4" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.066, -14]} receiveShadow>
        <circleGeometry args={[4.6, 32]} />
        <meshStandardMaterial color="#e3d4b4" roughness={1} />
      </mesh>
    </group>
  );
}

function Fountain() {
  return (
    <group position={[FOUNTAIN.x, 0, FOUNTAIN.z]}>
      <mesh position-y={0.3} castShadow receiveShadow>
        <cylinderGeometry args={[FOUNTAIN.r, FOUNTAIN.r + 0.1, 0.6, 28]} />
        <meshStandardMaterial color="#f1ece2" roughness={0.8} />
      </mesh>
      {/* zellige band */}
      <mesh position-y={0.42}>
        <cylinderGeometry args={[FOUNTAIN.r + 0.01, FOUNTAIN.r + 0.01, 0.14, 28, 1, true]} />
        <meshStandardMaterial color="#1f6f8b" roughness={0.4} />
      </mesh>
      <mesh position-y={0.55} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[FOUNTAIN.r - 0.18, 28]} />
        <meshStandardMaterial color="#3d8fb0" roughness={0.15} metalness={0.1} />
      </mesh>
      <mesh position-y={1.1} castShadow>
        <cylinderGeometry args={[0.22, 0.3, 1.2, 12]} />
        <meshStandardMaterial color="#f1ece2" roughness={0.8} />
      </mesh>
      <mesh position-y={1.75} castShadow>
        <cylinderGeometry args={[0.9, 0.35, 0.25, 20]} />
        <meshStandardMaterial color="#f1ece2" roughness={0.8} />
      </mesh>
      <mesh position-y={2.05}>
        <sphereGeometry args={[0.18, 12, 8]} />
        <meshStandardMaterial color="#1f6f8b" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Trees() {
  const { trunks, crowns } = useMemo(() => {
    const r = rng(7);
    const trunks: Item[] = [];
    const crowns: Item[] = [];
    const greens = ["#4f7a35", "#5b8a3c", "#46703a", "#62903f"];
    for (const [x, z, s] of TREES) {
      trunks.push({ p: [x, 1.2 * s, z], s: [s, s, s] });
      const blobs: [number, number, number, number][] = [
        [0, 3.1, 0, 1.55],
        [0.8, 2.7, 0.3, 1.1],
        [-0.7, 2.8, -0.4, 1.15],
        [0.1, 3.7, -0.2, 1.0],
      ];
      for (const [bx, by, bz, br] of blobs) {
        crowns.push({
          p: [x + bx * s, by * s, z + bz * s],
          s: br * s * (0.9 + r() * 0.2),
          r: [r() * 3, r() * 3, 0],
          c: greens[Math.floor(r() * greens.length)],
        });
      }
    }
    return { trunks, crowns };
  }, []);

  const palms = useMemo(() => {
    const trunks: Item[] = [];
    const leaves: Item[] = [];
    PALMS.forEach(([x, z, s], i) => {
      const h = 5.2 * s;
      trunks.push({ p: [x, h / 2, z], s: [s, s, s] });
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + i;
        leaves.push({
          p: [x + Math.sin(a) * 0.9, h + 0.05, z + Math.cos(a) * 0.9],
          r: [0.5, a, 0],
          s,
          c: k % 2 ? "#4c7d34" : "#5e8f3a",
        });
      }
    });
    return { trunks, leaves };
  }, []);

  return (
    <group>
      <Inst items={trunks} castShadow>
        <cylinderGeometry args={[0.16, 0.26, 2.4, 7]} />
        <meshStandardMaterial color="#6b4f37" roughness={1} />
      </Inst>
      <Inst items={crowns} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} flatShading />
      </Inst>
      <Inst items={palms.trunks} castShadow>
        <cylinderGeometry args={[0.14, 0.24, 5.2, 7]} />
        <meshStandardMaterial color="#8b6d4c" roughness={1} />
      </Inst>
      <Inst items={palms.leaves} castShadow>
        {/* leaf: flattened box angled downward via its rotation */}
        <boxGeometry args={[0.45, 0.04, 2.0]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </Inst>
    </group>
  );
}

function Benches() {
  const parts = useMemo(() => {
    const wood: Item[] = [];
    const metal: Item[] = [];
    for (const [x, z, ry] of BENCHES) {
      wood.push({ p: placeLocal(x, z, ry, 0, 0.46, 0), r: [0, ry, 0], s: [1.8, 0.07, 0.5] });
      wood.push({ p: placeLocal(x, z, ry, 0, 0.78, -0.24), r: [-0.15, ry, 0], s: [1.8, 0.35, 0.06] });
      for (const lx of [-0.75, 0.75]) {
        metal.push({ p: placeLocal(x, z, ry, lx, 0.36, -0.05), r: [0, ry, 0], s: [0.07, 0.72, 0.5] });
      }
    }
    return { wood, metal };
  }, []);
  return (
    <group>
      <Inst items={parts.wood} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2f7a84" roughness={0.7} />
      </Inst>
      <Inst items={parts.metal} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2b2d31" roughness={0.5} metalness={0.4} />
      </Inst>
    </group>
  );
}

function Lamps() {
  const { poles, bulbs } = useMemo(
    () => ({
      poles: LAMPS.map(([x, z]) => ({ p: [x, 1.9, z] as V3 })),
      bulbs: LAMPS.map(([x, z]) => ({ p: [x, 3.9, z] as V3 })),
    }),
    [],
  );
  return (
    <group>
      <Inst items={poles} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 3.8, 6]} />
        <meshStandardMaterial color="#25282d" roughness={0.5} metalness={0.5} />
      </Inst>
      <Inst items={bulbs}>
        <sphereGeometry args={[0.22, 10, 8]} />
        <meshBasicMaterial color="#ffe0a3" toneMapped={false} />
      </Inst>
    </group>
  );
}

function Hedges() {
  const items = useMemo(() => {
    const h = PARK_HALF + 0.2;
    const out: Item[] = [];
    const seg = (cx: number, cz: number, len: number, alongX: boolean) =>
      out.push({ p: [cx, 0.45, cz], s: alongX ? [len, 0.9, 0.8] : [0.8, 0.9, len] });
    const half = (PARK_HALF - 2.2) / 2;
    for (const side of [-1, 1]) {
      seg(-(2.2 + half), side * h, PARK_HALF - 2.2, true);
      seg(2.2 + half, side * h, PARK_HALF - 2.2, true);
      seg(side * h, -(2.2 + half), PARK_HALF - 2.2, false);
      seg(side * h, 2.2 + half, PARK_HALF - 2.2, false);
    }
    return out;
  }, []);
  return (
    <Inst items={items} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3f6b30" roughness={1} />
    </Inst>
  );
}

function Court() {
  const { x, z, hw, hd } = COURT;
  const lines = useMemo(() => {
    const w = 0.08;
    const out: Item[] = [
      { p: [x - hw, 0.075, z], s: [w, 1, hd * 2] },
      { p: [x + hw, 0.075, z], s: [w, 1, hd * 2] },
      { p: [x, 0.075, z - hd], s: [hw * 2, 1, w] },
      { p: [x, 0.075, z + hd], s: [hw * 2, 1, w] },
      { p: [x, 0.075, z], s: [hw * 2, 1, w] },
    ];
    return out;
  }, [x, z, hw, hd]);
  const posts = useMemo(() => {
    const out: Item[] = [];
    for (const side of [-1, 1]) {
      const gz = z + side * (hd - 0.3);
      out.push({ p: [x - 1.5, 0.6, gz], s: [0.08, 1.2, 0.08] });
      out.push({ p: [x + 1.5, 0.6, gz], s: [0.08, 1.2, 0.08] });
      out.push({ p: [x, 1.2, gz], s: [3.08, 0.08, 0.08] });
    }
    return out;
  }, [x, z, hd]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[x, 0.07, z]} receiveShadow>
        <planeGeometry args={[hw * 2 + 0.6, hd * 2 + 0.6]} />
        <meshStandardMaterial color="#b4563f" roughness={0.95} />
      </mesh>
      <Inst items={lines}>
        <boxGeometry args={[1, 0.005, 1]} />
        <meshBasicMaterial color="#f4efe6" />
      </Inst>
      <Inst items={posts} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#f4f4f4" roughness={0.5} />
      </Inst>
      <mesh position={[x + 1, 0.12, z + 1.5]} castShadow>
        <icosahedronGeometry args={[0.12, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} flatShading />
      </mesh>
    </group>
  );
}

function City() {
  const data = useMemo(() => {
    const r = rng(42);
    const blocks: Item[] = [];
    const darkWin: Item[] = [];
    const litWin: Item[] = [];
    const shutters = ["#2f6f9f", "#2c5d87", "#3a7fae", "#7a5b3a"];
    const walls = ["#f4efe4", "#efe6d6", "#f7f3ec", "#e8dcc6", "#e6ebed", "#f1e3cf"];
    const D = 33;
    for (let side = 0; side < 4; side++) {
      const rot = (side * Math.PI) / 2;
      let lx = -30;
      while (lx < 30) {
        const w = 6 + r() * 5;
        const d = 8 + r() * 4;
        const h = 9 + Math.floor(r() * 5) * 3;
        const cx = lx + w / 2;
        const cz = -D - d / 2;
        blocks.push({
          p: placeLocal(0, 0, rot, cx, h / 2, cz),
          r: [0, rot, 0],
          s: [w - 0.4, h, d],
          c: walls[Math.floor(r() * walls.length)],
        });
        // windows on the facade facing the park (+z in local frame)
        const fz = -D + 0.06;
        const cols = Math.max(2, Math.floor((w - 1.4) / 2));
        const rows = Math.floor((h - 2) / 3);
        const shutter = shutters[Math.floor(r() * shutters.length)];
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const wx = lx + 0.9 + (col + 0.5) * ((w - 1.8) / cols);
            const wy = 2.4 + row * 3;
            const lit = r() < 0.22;
            const item: Item = {
              p: placeLocal(0, 0, rot, wx, wy, fz),
              r: [0, rot, 0],
              s: [0.95, 1.45, 1],
              c: lit ? undefined : shutter,
            };
            (lit ? litWin : darkWin).push(item);
          }
        }
        lx += w;
      }
    }
    return { blocks, darkWin, litWin };
  }, []);

  return (
    <group>
      <Inst items={data.blocks} receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.95} />
      </Inst>
      <Inst items={data.darkWin}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshStandardMaterial color="#ffffff" roughness={0.6} />
      </Inst>
      <Inst items={data.litWin}>
        <boxGeometry args={[1, 1, 0.1]} />
        <meshBasicMaterial color="#ffd38a" toneMapped={false} />
      </Inst>
      {/* mosque dome and minaret on the skyline */}
      <group position={[22, 0, -52]}>
        <mesh position-y={8}>
          <boxGeometry args={[14, 16, 14]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.9} />
        </mesh>
        <mesh position-y={16}>
          <sphereGeometry args={[5.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#e9e4d8" roughness={0.6} />
        </mesh>
        <mesh position={[-9, 15, 0]}>
          <boxGeometry args={[3, 30, 3]} />
          <meshStandardMaterial color="#f5f1e8" roughness={0.9} />
        </mesh>
        <mesh position={[-9, 31.5, 0]}>
          <boxGeometry args={[2.2, 3, 2.2]} />
          <meshStandardMaterial color="#3c8a6a" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

function Cars() {
  const cars: [number, number, number, string][] = [
    [-12, 25.5, Math.PI / 2, "#c43b35"],
    [6, 25.5, Math.PI / 2, "#e6e6e6"],
    [25.5, -6, 0, "#2d5aa0"],
    [-25.5, 10, 0, "#d9a33a"],
    [-4, -25.5, Math.PI / 2, "#5a5f66"],
  ];
  const bodies = cars.map(([x, z, r, c]) => ({ p: [x, 0.55, z] as V3, r: [0, r, 0] as V3, c }));
  const cabins = cars.map(([x, z, r, c]) => ({
    p: [x, 1.15, z] as V3,
    r: [0, r, 0] as V3,
    c,
  }));
  return (
    <group>
      <Inst items={bodies} castShadow>
        <boxGeometry args={[1.8, 0.7, 4.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.35} metalness={0.3} />
      </Inst>
      <Inst items={cabins} castShadow>
        <boxGeometry args={[1.6, 0.6, 2.2]} />
        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.4} />
      </Inst>
    </group>
  );
}

/** Static environment: an Algiers-style neighbourhood park at golden hour. */
export function Park() {
  return (
    <group>
      <Sky />
      <Ground />
      <Fountain />
      <Trees />
      <Benches />
      <Lamps />
      <Hedges />
      <Court />
      <City />
      <Cars />
    </group>
  );
}
