# Salati — Prayer Trainer (`app/dashboard/games/salati/`)

## Team

- Group: `game:salati`
- Members: linuxcoding-ADAM (developer, to be confirmed)

## Summary

A prayer-practice game. The player learns the nine movements of the prayer in a 3D mosque
(Learn mode), or puts the movements back in the correct order and answers short dhikr questions
(Challenge mode, three difficulty levels).

## Learning goals

Shown on the hub result screen (`manifest.ts`):

- The order of the prayer movements, from the opening takbir to the salam.
- The dhikr said in ruku, sujud and tashahhud.
- Ask a teacher or a parent about any posture that is not clear.

## Audience

- Age range: 7 to 14 (`manifest.ageRange`). To be confirmed by the team.
- The game is an educational simulation. It is not a fatwa and does not judge anyone's prayer.

## Game mechanics

- Start from the hub intro, then choose a mode:
  - **Learn:** the 3D figure performs each movement when the player taps it. Taps on the
    next expected step advance the run.
  - **Challenge:** the buttons are shuffled. The player taps the steps in order. Some steps open
    a quiz (easy: multiple choice with a hint; medium: type the missing word; hard: same as medium
    with a 30-second timer per attempt).
- A wrong tap never advances the run and never reveals the correct order in Challenge mode.
- Points (`maxPointsPerRun` = 30):
  - Challenge: `round(score / 100 * 30)`, where `score` is the first-try accuracy of the steps
    (50 %) and the quiz questions (50 %), see `_engine/logic/ScoringEngine.js`.
  - Learn: `round(completed steps / 9 * 30)`. Learn has no quiz, so the points only reflect
    completing the lesson. **To be confirmed by the team.**
- The game reports the run once through `onFinish`. The hub shows the result screen.
- Nothing is random for points. Randomness only changes the order of the buttons and the
  answer options.

## Content and sources

| Element (file under `_engine/…`) | Source | Verified by | Date |
| --- | --- | --- | --- |
| Movement order, instructions (`data/prayerData.js`) | Not documented yet | — | `TODO-VERIFICATION` |
| Recitation texts, dhikr (`data/prayerData.js`) | — | — | `TODO-VERIFICATION` |
| Fiqh statements, Maliki options (`data/prayerPractice.js`) | — | — | `TODO-VERIFICATION` |
| References list (`PRAYER_SOURCES`) | sunnah.com (Bukhari 757, 812, 828; Muslim 582), marw.gov.dz, Ibn Abi Zayd's Risala | — | `TODO-VERIFICATION` (check each link) |

No Quranic verse or hadith text is quoted from memory. Every recitation text must be checked
against a reliable source before the game is set to `pret`.

## Validation checklist (before `status: "pret"`)

- [ ] All content in `_engine/data/` reviewed by a qualified teacher.
- [ ] No `TODO-VERIFICATION` left in the code or in this table.
- [ ] Character images reviewed: modest clothing, no prophet or companion depicted (section 9.2).
- [ ] Tested on a 360 px mobile width and on desktop, in Arabic (RTL).
- [ ] WebGL checked on a low-end Android device. The game falls back to the text instructions
      if WebGL fails.
- [ ] `onFinish` called once per run; timers, dialogs and the WebGL context released on unmount.

## Technical notes

### Layout

- `_engine/` is the original Three.js game (scene, animation, scoring, quiz) adapted to run
  inside a React component.
- `_components/Game.tsx` creates a `GameController` in a `div` it owns, and destroys it on unmount.
- The welcome and result screens of the original game are removed: the hub's `GameShell`
  shows the intro and the result. The mode selection stays inside the game.
- Audio was already disabled in the original project and is not included.
- The 3D model file of the original project was not referenced by any code and is not included.

### Stylesheet

`_components/salati.css` is generated from the original stylesheet. Every selector is
prefixed with `.wladz-salati`, and `position: fixed` is replaced with `position: absolute`, so the
styles cannot leak into the hub and overlays stay inside the game area. `_components/embed.css`
holds the overrides for the game area size.

To regenerate it, run the one-off transform (postcss, available in the wladz dependencies)
on the original `src/style.css`. Do not edit `salati.css` by hand.

### Dependencies

- `three` 0.160.1 and `gsap` 3.15.0, the same versions as the original project.
  They are listed as exact versions in `package.json` and recorded in `CRITICAL_CHANGES.md`
  (entry `CC-20261014-game-salati-01`).

### Known limitations

- The engine modules are still plain JavaScript (the original project was not TypeScript).
  They are not type-checked by `tsc`.
- The engine builds parts of its interface with `innerHTML`, from author-written constants only.
  No user input reaches these templates. Moving them to React would remove the need for them.
- The original `docs/prayer-accuracy.md` (Arabic) and the test suites of the original project are
  not included here. The accuracy references are listed in `PRAYER_SOURCES`.
