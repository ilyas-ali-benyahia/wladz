"use client";

import { useFrame } from "@react-three/fiber";
import { useRef, type RefObject } from "react";
import type * as THREE from "three";
import type { Anim } from "./story";

export type CharacterLook = {
  skin: string;
  top: string;
  pants: string;
  shoes: string;
  hair: string;
  style: "short" | "cap" | "hijab" | "curly";
  accent?: string;
};

export type AnimState = { name: Anim; speed: number };

type Props = {
  look: CharacterLook;
  anim: RefObject<AnimState>;
  /** Shows a small generic item in the right hand while the "offer" anim plays. */
  holdsItem?: boolean;
  /** Offsets idle motion so characters don't move in sync. */
  phase?: number;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

/**
 * Low-poly procedural teenager. Faces +z. All animation is procedural
 * (limb rotations blended toward a target pose every frame).
 */
export function Character({ look, anim, holdsItem = false, phase = 0 }: Props) {
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const item = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!body.current || !legL.current || !legR.current || !armL.current || !armR.current || !head.current) return;
    const { name, speed } = anim.current ?? { name: "idle", speed: 0 };
    const t = state.clock.elapsedTime + phase;

    let lL = 0;
    let lR = 0;
    let aLx = 0;
    let aLz = 0.08;
    let aRx = 0;
    let aRz = -0.08;
    let hx = 0;
    let hy = 0;
    let by = 0;

    switch (name) {
      case "walk":
      case "walkAway": {
        const amp = 0.6 * Math.min(1, Math.max(0.35, speed));
        const f = t * (6 + 5 * Math.min(1, speed));
        lL = Math.sin(f) * amp;
        lR = -lL;
        aLx = -lL * 0.8;
        aRx = lL * 0.8;
        by = Math.abs(Math.sin(f)) * 0.05 * amp;
        break;
      }
      case "talk":
        hx = Math.sin(t * 5) * 0.07;
        aRx = -0.55 + Math.sin(t * 3) * 0.25;
        aRz = -0.2;
        break;
      case "offer":
        aRx = -1.25;
        aRz = 0.05;
        hx = Math.sin(t * 2) * 0.04;
        break;
      case "nod":
        hx = 0.1 + Math.sin(t * 7) * 0.2;
        break;
      case "shake":
        hy = Math.sin(t * 8) * 0.45;
        break;
      case "shrug": {
        const s = Math.sin(t * 3) * 0.5 + 0.5;
        aLz = 0.45 + s * 0.3;
        aRz = -(0.45 + s * 0.3);
        aLx = -0.45;
        aRx = -0.45;
        hy = 0.15 * Math.sin(t * 1.5);
        break;
      }
      case "cheer":
        aLz = 2.6;
        aRz = -2.6;
        by = Math.abs(Math.sin(t * 6)) * 0.18;
        hx = -0.15;
        break;
      case "wave":
        aRz = -2.5 + Math.sin(t * 9) * 0.35;
        hx = -0.05;
        break;
      case "crossArms":
        aLx = -0.95;
        aLz = -0.65;
        aRx = -0.95;
        aRz = 0.65;
        hy = Math.sin(t * 0.8) * 0.08;
        break;
      case "lookDown":
        hx = 0.45;
        aLz = 0.03;
        aRz = -0.03;
        break;
      case "angry":
        aLz = 0.3;
        aRz = -0.3;
        aLx = 0.15;
        aRx = 0.15;
        hx = -0.12;
        hy = Math.sin(t * 14) * 0.12;
        break;
      default:
        // idle: breathing and glancing around
        hx = Math.sin(t * 0.7) * 0.03;
        hy = Math.sin(t * 0.4) * 0.15;
        aLz = 0.08 + Math.sin(t * 1.3) * 0.02;
        aRz = -0.08 - Math.sin(t * 1.3) * 0.02;
        by = Math.sin(t * 1.6) * 0.006;
    }

    const k = 1 - Math.exp(-delta * 12);
    legL.current.rotation.x = lerp(legL.current.rotation.x, lL, k);
    legR.current.rotation.x = lerp(legR.current.rotation.x, lR, k);
    armL.current.rotation.x = lerp(armL.current.rotation.x, aLx, k);
    armL.current.rotation.z = lerp(armL.current.rotation.z, aLz, k);
    armR.current.rotation.x = lerp(armR.current.rotation.x, aRx, k);
    armR.current.rotation.z = lerp(armR.current.rotation.z, aRz, k);
    head.current.rotation.x = lerp(head.current.rotation.x, hx, k);
    head.current.rotation.y = lerp(head.current.rotation.y, hy, k);
    body.current.position.y = lerp(body.current.position.y, by, k);
    if (item.current) item.current.visible = holdsItem && name === "offer";
  });

  const skin = <meshStandardMaterial color={look.skin} roughness={0.75} />;

  return (
    <group ref={body}>
      {/* legs */}
      {[legL, legR].map((ref, i) => (
        <group key={i} ref={ref} position={[i === 0 ? 0.11 : -0.11, 0.92, 0]}>
          <mesh position={[0, -0.4, 0]} castShadow>
            <capsuleGeometry args={[0.085, 0.62, 3, 8]} />
            <meshStandardMaterial color={look.pants} roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.86, 0.05]} castShadow>
            <boxGeometry args={[0.15, 0.1, 0.28]} />
            <meshStandardMaterial color={look.shoes} roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* hips + torso */}
      <mesh position={[0, 0.97, 0]} castShadow>
        <boxGeometry args={[0.42, 0.18, 0.24]} />
        <meshStandardMaterial color={look.pants} roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.24, 0]} castShadow>
        <boxGeometry args={[0.48, 0.58, 0.27]} />
        <meshStandardMaterial color={look.top} roughness={0.85} />
      </mesh>
      {look.accent && (
        <mesh position={[0, 1.26, 0.137]}>
          <boxGeometry args={[0.2, 0.08, 0.01]} />
          <meshStandardMaterial color={look.accent} roughness={0.6} />
        </mesh>
      )}

      {/* arms */}
      {[armL, armR].map((ref, i) => (
        <group key={i} ref={ref} position={[i === 0 ? 0.31 : -0.31, 1.47, 0]}>
          <mesh position={[0, -0.26, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.42, 3, 8]} />
            <meshStandardMaterial color={look.top} roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.56, 0]}>
            <sphereGeometry args={[0.065, 8, 6]} />
            {skin}
          </mesh>
          {i === 1 && (
            <mesh ref={item} position={[0, -0.6, 0.07]} visible={false}>
              <boxGeometry args={[0.07, 0.11, 0.03]} />
              <meshStandardMaterial color="#3b3f46" roughness={0.5} />
            </mesh>
          )}
        </group>
      ))}

      {/* neck + head */}
      <mesh position={[0, 1.56, 0]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        {skin}
      </mesh>
      <group ref={head} position={[0, 1.62, 0]}>
        <mesh position={[0, 0.12, 0]} scale={[1, 1.1, 1]} castShadow>
          <sphereGeometry args={[0.165, 14, 10]} />
          {skin}
        </mesh>
        {[-0.058, 0.058].map((x) => (
          <mesh key={x} position={[x, 0.14, 0.152]}>
            <sphereGeometry args={[0.02, 6, 4]} />
            <meshBasicMaterial color="#1b1b22" />
          </mesh>
        ))}
        <Hair look={look} />
      </group>
    </group>
  );
}

function Hair({ look }: { look: CharacterLook }) {
  const mat = <meshStandardMaterial color={look.hair} roughness={0.9} />;
  switch (look.style) {
    case "cap":
      return (
        <group position={[0, 0.2, 0]}>
          <mesh scale={[1, 0.6, 1]}>
            <sphereGeometry args={[0.175, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            {mat}
          </mesh>
          <mesh position={[0, 0.005, 0.17]} rotation={[0.15, 0, 0]}>
            <boxGeometry args={[0.24, 0.02, 0.15]} />
            {mat}
          </mesh>
        </group>
      );
    case "hijab":
      return (
        <group>
          <mesh position={[0, 0.12, -0.012]} scale={[1.12, 1.2, 1.12]}>
            {/* open toward +z so the face shows */}
            <sphereGeometry args={[0.165, 14, 10, Math.PI / 2 + 0.7, Math.PI * 2 - 1.4, 0.15, Math.PI * 0.8]} />
            <meshStandardMaterial color={look.hair} roughness={0.95} side={2} />
          </mesh>
          <mesh position={[0, -0.08, -0.01]}>
            <cylinderGeometry args={[0.15, 0.24, 0.16, 12]} />
            {mat}
          </mesh>
        </group>
      );
    case "curly":
      return (
        <group position={[0, 0.22, -0.02]}>
          {[
            [0, 0.04, 0],
            [0.1, 0, 0.02],
            [-0.1, 0, 0.02],
            [0, 0, -0.1],
            [0.08, -0.06, -0.08],
            [-0.08, -0.06, -0.08],
          ].map((p, i) => (
            <mesh key={i} position={p as [number, number, number]}>
              <icosahedronGeometry args={[0.09, 0]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
    default:
      return (
        <mesh position={[0, 0.17, -0.015]} scale={[1.04, 0.7, 1.06]}>
          <sphereGeometry args={[0.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          {mat}
        </mesh>
      );
  }
}
