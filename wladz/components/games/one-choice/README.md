# Game 01 — One Choice

A 45–90 second 3D mini-game about handling peer pressure. Route: `/games/one-choice`.

## Install into WlaDZ

1. Copy `components/games/one-choice/` and `app/games/one-choice/page.tsx` into the project
   (adjust the `@/components/...` import if the alias differs; for the Pages Router, render
   `<OneChoiceGame />` from `pages/games/one-choice.tsx` instead).
2. Add the 3D dependencies if they aren't there yet:
   `npm i three @react-three/fiber && npm i -D @types/three`
   (tested with Next 15.5, React 19.1, three 0.186, @react-three/fiber 9.8; React 18 projects need `@react-three/fiber@8`).
3. `npm run dev` and open `/games/one-choice`.

No backend, assets, fonts or global CSS are required; styles live in `OneChoice.module.css`.

## Files

| File | Role |
| --- | --- |
| `OneChoiceGame.tsx` | Client entry: phases, UI, keyboard/mouse/pointer-lock, pause, replay. Loads the 3D scene with `next/dynamic` (`ssr: false`). |
| `Scene.tsx` | R3F canvas, lights, player movement, third-person + conversation camera, NPC behaviour. |
| `Park.tsx` | Procedural Algiers-style park (instanced trees, palms, benches, lamps, buildings, fountain, football court). |
| `Character.tsx` | Low-poly procedural teen with blended procedural animations. |
| `TouchControls.tsx` | Virtual joystick + multitouch camera drag zone. |
| `story.ts` | All dialogue, choices, outcomes and messages (edit text here). |
| `layout.ts` | World positions and collision. |
| `input.ts` | Shared input state. |

## Reuse for future games

`Character`, `TouchControls`, `input.ts` and the `Inst` instancing helper in `Park.tsx` are game-agnostic.
