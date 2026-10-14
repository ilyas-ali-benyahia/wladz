"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Character, type AnimState, type CharacterLook } from "./Character";
import { readMove, type InputState } from "./input";
import {
  GROUP_CENTER,
  INTERACT_RADIUS,
  NPC_POSITIONS,
  PLAYER_START,
  PLAYER_START_ROT,
  TALK_SPOT,
  resolveCollisions,
} from "./layout";
import { FOG_COLOR, Park } from "./Park";
import type { ActorId, Anim, NpcId } from "./story";

export type Phase = "intro" | "explore" | "dialogue" | "outcome" | "complete";

export type SceneProps = {
  phase: Phase;
  paused: boolean;
  runId: number;
  input: InputState;
  anims: Record<ActorId, Anim>;
  lowPower: boolean;
  onNearChange: (near: boolean) => void;
  onReady: () => void;
  onContextLost: () => void;
};

const LOOKS: Record<ActorId, CharacterLook> = {
  player: {
    skin: "#c99a76",
    top: "#1fb5a6",
    pants: "#2b3a55",
    shoes: "#f2f2f2",
    hair: "#2a1d17",
    style: "short",
    accent: "#ffd84d",
  },
  yacine: {
    skin: "#b98463",
    top: "#b8352f",
    pants: "#34343a",
    shoes: "#1e1e1e",
    hair: "#1d1612",
    style: "curly",
  },
  amel: {
    skin: "#d4a888",
    top: "#7a5aa6",
    pants: "#3b3550",
    shoes: "#f0e6e6",
    hair: "#c98ca8",
    style: "hijab",
  },
  karim: {
    skin: "#a8754f",
    top: "#f0b429",
    pants: "#4a5a3a",
    shoes: "#ffffff",
    hair: "#2b6ad1",
    style: "cap",
  },
};

const NPC_IDS: NpcId[] = ["yacine", "amel", "karim"];
const CAM_DIST = 5.4;
const WALK_SPEED = 4.4;

function lerpAngle(a: number, b: number, k: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

/** Fires onReady once the first frames have actually rendered. */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const frames = useRef(0);
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    frames.current += 1;
    if (frames.current >= 2) {
      done.current = true;
      onReady();
    }
  });
  return null;
}

function GameWorld({
  phase,
  input,
  anims,
  onNearChange,
}: Pick<SceneProps, "phase" | "input" | "anims" | "onNearChange">) {
  const camera = useThree((s) => s.camera);
  const player = useRef<THREE.Group>(null);
  const playerAnim = useRef<AnimState>({ name: "idle", speed: 0 });
  const yacine = useRef<THREE.Group>(null);
  const amel = useRef<THREE.Group>(null);
  const karim = useRef<THREE.Group>(null);
  const npcGroups: Record<NpcId, RefObject<THREE.Group | null>> = { yacine, amel, karim };
  const yacineAnim = useRef<AnimState>({ name: "talk", speed: 0 });
  const amelAnim = useRef<AnimState>({ name: "idle", speed: 0 });
  const karimAnim = useRef<AnimState>({ name: "idle", speed: 0 });
  const npcAnims: Record<NpcId, RefObject<AnimState>> = {
    yacine: yacineAnim,
    amel: amelAnim,
    karim: karimAnim,
  };
  const marker = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  const yaw = useRef(0);
  const pitch = useRef(0.32);
  const near = useRef(false);
  const walkedAway = useRef(false);
  const tmp = useMemo(
    () => ({ desired: new THREE.Vector3(), look: new THREE.Vector3(), lookCur: new THREE.Vector3(0, 1.4, 0) }),
    [],
  );

  // Make sure the UI never keeps a stale "near" flag from a previous run.
  useEffect(() => {
    onNearChange(false);
  }, [onNearChange]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const p = player.current;
    if (!p) return;
    const t = state.clock.elapsedTime;

    // Consume look input every frame so nothing accumulates while it's ignored.
    const ldx = input.look.dx;
    const ldy = input.look.dy;
    input.look.dx = 0;
    input.look.dy = 0;

    const { desired, look, lookCur } = tmp;

    if (phase === "intro") {
      const a = t * 0.07 + 0.6;
      desired.set(Math.sin(a) * 24, 9, Math.cos(a) * 24);
      look.set(0, 1.5, -2);
      playerAnim.current.name = "idle";
    } else if (phase === "explore") {
      yaw.current -= ldx * 0.0035;
      pitch.current = THREE.MathUtils.clamp(pitch.current + ldy * 0.0028, -0.12, 1.05);

      const m = readMove(input);
      const len = Math.hypot(m.x, m.y);
      if (len > 0.08) {
        const sy = Math.sin(yaw.current);
        const cy = Math.cos(yaw.current);
        const dx = -sy * m.y + cy * m.x;
        const dz = -cy * m.y - sy * m.x;
        const pos = { x: p.position.x + dx * WALK_SPEED * dt, z: p.position.z + dz * WALK_SPEED * dt };
        resolveCollisions(pos);
        p.position.x = pos.x;
        p.position.z = pos.z;
        p.rotation.y = lerpAngle(p.rotation.y, Math.atan2(dx, dz), damp(14, dt));
        playerAnim.current.name = "walk";
        playerAnim.current.speed = len;
      } else {
        playerAnim.current.name = "idle";
        playerAnim.current.speed = 0;
      }

      const [yx, , yz] = NPC_POSITIONS.yacine;
      const isNear = Math.hypot(p.position.x - yx, p.position.z - yz) < INTERACT_RADIUS;
      if (isNear !== near.current) {
        near.current = isNear;
        onNearChange(isNear);
      }

      const cp = Math.cos(pitch.current);
      look.set(p.position.x, 1.45, p.position.z);
      desired.set(
        look.x + Math.sin(yaw.current) * cp * CAM_DIST,
        look.y + Math.sin(pitch.current) * CAM_DIST,
        look.z + Math.cos(yaw.current) * cp * CAM_DIST,
      );
    } else {
      // Conversation: dialogue, outcome and completion.
      const pa = anims.player;
      if (pa === "walkAway") walkedAway.current = true;

      if (walkedAway.current) {
        if (pa === "walkAway" && p.position.z < TALK_SPOT[2] + 7) {
          const pos = { x: p.position.x, z: p.position.z + 2.4 * dt };
          resolveCollisions(pos);
          p.position.x = pos.x;
          p.position.z = pos.z;
          p.rotation.y = lerpAngle(p.rotation.y, 0.15, damp(8, dt));
          playerAnim.current.name = "walkAway";
          playerAnim.current.speed = 0.7;
        } else {
          playerAnim.current.name = pa === "walkAway" ? "idle" : pa;
        }
        look.set((p.position.x + GROUP_CENTER[0]) / 2, 0.4, (p.position.z + GROUP_CENTER[2]) / 2);
        desired.set(4.6, 3.6, -4.2);
      } else {
        const dx = TALK_SPOT[0] - p.position.x;
        const dz = TALK_SPOT[2] - p.position.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.08) {
          const step = Math.min(dist, 3.2 * dt);
          const pos = { x: p.position.x + (dx / dist) * step, z: p.position.z + (dz / dist) * step };
          resolveCollisions(pos);
          p.position.x = pos.x;
          p.position.z = pos.z;
          p.rotation.y = lerpAngle(p.rotation.y, Math.atan2(dx, dz), damp(12, dt));
          playerAnim.current.name = "walk";
          playerAnim.current.speed = 0.7;
        } else {
          const face = Math.atan2(GROUP_CENTER[0] - p.position.x, GROUP_CENTER[2] - p.position.z);
          p.rotation.y = lerpAngle(p.rotation.y, face, damp(8, dt));
          playerAnim.current.name = pa;
          playerAnim.current.speed = 0;
        }
        // Aim low so the group sits in the upper half, clear of the dialogue panel.
        look.set(GROUP_CENTER[0] - 0.3, 0.55, GROUP_CENTER[2] + 0.6);
        desired.set(p.position.x + 2.7, 2.8, p.position.z + 4.2);
      }
    }

    camera.position.lerp(desired, damp(phase === "explore" ? 14 : 3.5, dt));
    lookCur.lerp(look, damp(phase === "explore" ? 18 : 4, dt));
    camera.lookAt(lookCur);

    // NPCs: face the player when relevant, otherwise chat in a circle.
    const conversation = phase === "dialogue" || phase === "outcome" || phase === "complete";
    for (const id of NPC_IDS) {
      const g = npcGroups[id].current;
      if (!g) continue;
      const [nx, , nz] = NPC_POSITIONS[id];
      const dPlayer = Math.hypot(p.position.x - nx, p.position.z - nz);
      const facePlayer = conversation || (phase === "explore" && dPlayer < 9);
      const tx = facePlayer ? p.position.x : GROUP_CENTER[0];
      const tz = facePlayer ? p.position.z : GROUP_CENTER[2];
      g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(tx - nx, tz - nz), damp(5, dt));

      let name: Anim;
      if (conversation) name = anims[id];
      else if (id === "yacine") name = dPlayer < 9 ? "idle" : "talk";
      else if (id === "amel") name = phase === "explore" && dPlayer < 6.5 ? "wave" : "idle";
      else name = dPlayer > 9 && Math.sin(t * 0.5) > 0.3 ? "nod" : "idle";
      npcAnims[id].current.name = name;
    }

    // Objective marker
    const showMarker = phase === "explore";
    if (marker.current) {
      marker.current.visible = showMarker;
      marker.current.position.y = 2.75 + Math.sin(t * 2.5) * 0.12;
      marker.current.rotation.y = t * 1.5;
    }
    if (ring.current) {
      ring.current.visible = showMarker;
      const s = 1 + (Math.sin(t * 3) * 0.5 + 0.5) * 0.12;
      ring.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      <group ref={player} position={PLAYER_START} rotation-y={PLAYER_START_ROT}>
        <Character look={LOOKS.player} anim={playerAnim} />
      </group>

      {NPC_IDS.map((id, i) => (
        <group key={id} ref={npcGroups[id]} position={NPC_POSITIONS[id]}>
          <Character look={LOOKS[id]} anim={npcAnims[id]} holdsItem={id === "yacine"} phase={i * 1.7} />
        </group>
      ))}

      <group ref={marker} position={[NPC_POSITIONS.yacine[0], 2.75, NPC_POSITIONS.yacine[2]]}>
        <mesh>
          <octahedronGeometry args={[0.16, 0]} />
          <meshBasicMaterial color="#38f2dc" toneMapped={false} />
        </mesh>
      </group>
      <mesh
        ref={ring}
        rotation-x={-Math.PI / 2}
        position={[NPC_POSITIONS.yacine[0], 0.09, NPC_POSITIONS.yacine[2] + 0.4]}
      >
        <ringGeometry args={[INTERACT_RADIUS - 0.25, INTERACT_RADIUS - 0.05, 48]} />
        <meshBasicMaterial color="#38f2dc" transparent opacity={0.45} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}

export default function Scene({
  phase,
  paused,
  runId,
  input,
  anims,
  lowPower,
  onNearChange,
  onReady,
  onContextLost,
}: SceneProps) {
  const shadowSize = lowPower ? 1024 : 2048;
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      dpr={lowPower ? [1, 1.5] : [1, 2]}
      frameloop={paused ? "never" : "always"}
      camera={{ fov: 55, near: 0.1, far: 220, position: [18, 9, 18] }}
      gl={{ antialias: !lowPower, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onContextLost();
        });
      }}
      style={{ touchAction: "none" }}
    >
      <fog attach="fog" args={[FOG_COLOR, 38, 115]} />
      <hemisphereLight args={["#ffe4c8", "#4f5e3e", 1.15]} />
      <directionalLight
        position={[-16, 22, 18]}
        intensity={2.6}
        color="#ffc896"
        castShadow
        shadow-mapSize={[shadowSize, shadowSize]}
        shadow-camera-left={-27}
        shadow-camera-right={27}
        shadow-camera-top={27}
        shadow-camera-bottom={-27}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-bias={-0.0005}
        shadow-normalBias={0.03}
      />
      <pointLight position={[0, 3.6, -11]} color="#ffd59a" intensity={8} distance={11} decay={2} />
      <Park />
      <GameWorld key={runId} phase={phase} input={input} anims={anims} onNearChange={onNearChange} />
      <ReadySignal onReady={onReady} />
    </Canvas>
  );
}
