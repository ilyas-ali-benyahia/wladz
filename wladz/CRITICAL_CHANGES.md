# CRITICAL CHANGES — WLADZ

> Journal des **écarts aux règles communes** (`WLADZ_TEAM_PROMPT.md`) forcés par un développeur, et des **changements de contrat** décidés par Hub & Core (schéma, API, `types/game.ts`, tokens, routes).
>
> - **Tout agent lit ce fichier au début de chaque session**, dans sa version locale **et** sur `origin/main` (`git show origin/main:wladz/CRITICAL_CHANGES.md`), puis résume au développeur les entrées qu'il n'a pas encore validées (voir `WLADZ_TEAM_PROMPT.md` §2 et §12).
> - Une entrée mergée dans `main` et marquée `actif` **remplace** la règle qu'elle cite, dans le périmètre décrit. Sur une branche non mergée, c'est une simple proposition.
> - Les entrées sont **ajoutées à la fin** du journal, jamais modifiées ni supprimées. Pour annuler une décision, ajouter une nouvelle entrée qui la marque `annulé`.
> - En cas de conflit Git sur ce fichier : **garder toutes les entrées des deux côtés**.

## Modèle d'entrée (à copier à la fin du journal)

```md
### CC-AAAAMMJJ-<groupe>-<nn> — <titre court>

- **Date** : AAAA-MM-JJ
- **Développeur** : <pseudo GitHub>
- **Groupe** : <hub-core | game:<slug>>
- **Branche / PR** : <branche> — #<numéro de PR>
- **Type** : écart forcé | évolution de contrat (Core)
- **Règle(s) concernée(s)** : WLADZ_TEAM_PROMPT.md §<numéro> — <résumé>
- **Changement** : <ce qui change concrètement : fichiers, dépendances, comportement>
- **Raison** : <pourquoi le développeur a choisi de forcer / pourquoi le contrat évolue>
- **Conséquences et risques acceptés** : <ce qui a été expliqué par l'agent>
- **Impact sur les autres groupes** : <aucun | qui et quoi>
- **Action requise pour les autres** : <aucune | npm install après merge | supprimer .data/auth.sqlite | …>
- **Nouvelle règle effective** : <la règle telle qu'elle s'applique désormais>
- **Statut** : actif | annulé (par CC-…)
```

## Journal

<!-- Ajouter les nouvelles entrées SOUS cette ligne, à la fin du fichier. -->

### CC-20261013-hub-core-01 — Jeux dans `app/dashboard/games/<slug>/` et règles allégées

- **Date** : 2026-10-13
- **Développeur** : simo-sh
- **Groupe** : hub-core
- **Branche / PR** : main (push direct)
- **Type** : évolution de contrat (Core)
- **Règle(s) concernée(s)** : WLADZ_TEAM_PROMPT.md §3, §5, §6, §8.5, §11, §12
- **Changement** :
  - Les jeux ne vivent plus dans `games/<slug>/` mais dans le dossier de route `app/dashboard/games/<slug>/` (URL `/dashboard/games/<slug>`), avec `page.tsx`, `manifest.ts`, `README.md`, `_components/Game.tsx`, `_data/`.
  - Le modèle est `app/dashboard/games/_template/` ; `components/games/GameShell.tsx` (version minimale) affiche l'intro et le résultat.
  - Le registre généré est `lib/games.generated.ts` ; plus de bac à sable `app/sandbox/` (chaque jeu a sa route).
  - Fin des PR et approbations obligatoires : on travaille sur `main` avec `git pull --no-rebase` avant chaque push ; les commandes forcées restent interdites.
  - Licences d'assets et polices/CDN externes : plus aucune contrainte pour le prototype.
  - Jeu HTML autonome ou React : au choix du développeur.
- **Raison** : routes plus propres, un jeu = une URL ; vitesse prioritaire sur le formalisme.
- **Conséquences et risques acceptés** : sans relecture obligatoire, chacun vérifie l'existant et reste dans sa zone avant de pousser.
- **Impact sur les autres groupes** : tous les groupes jeux.
- **Action requise pour les autres** : créer son jeu en copiant `app/dashboard/games/_template/`.
- **Nouvelle règle effective** : celle du WLADZ_TEAM_PROMPT.md à jour au 2026-10-13.
- **Statut** : actif



### CC-20261014-game-salati-01 — Salati prayer trainer: Three.js and GSAP dependencies

- **Date** : 2026-10-14
- **Développeur** : linuxcoding-ADAM
- **Groupe** : game:salati
- **Branche / PR** : game/salati — PR to main (not yet opened)
- **Type** : écart forcé
- **Règle(s) concernée(s)** : WLADZ_TEAM_PROMPT.md §4 (three.js listed as a game engine that needs the deviation protocol), §6.5 #9 (new npm dependency)
- **Changement** : adds `three` 0.160.1 and `gsap` 3.15.0 (exact versions, same as the original Salati project) to `wladz/package.json`. Adds the game folder `app/dashboard/games/salati/` (engine in `_engine/`, Three.js scene included) and `public/games/salati/thumbnail.webp`. The game keeps its Three.js architecture: it is not converted to static HTML.
- **Raison** : the Salati game is a 3D Three.js application. The developer chose to keep its architecture (option B of the deviation protocol).
- **Conséquences et risques acceptés** : larger client bundle (Three.js is loaded only when the Learn mode starts). WebGL is required for the 3D lesson, and the game falls back to text instructions if WebGL fails. The engine is plain JavaScript, not type-checked. The game uses a scoped copy of the original stylesheet and some `innerHTML` templates built from static constants.
- **Impact sur les autres groupes** : none. The dependencies are used only by the Salati game folder.
- **Action requise pour les autres** : run `npm ci` after pulling this change (the lockfile gains `three` and `gsap`).
- **Nouvelle règle effective** : a game may depend on `three` and `gsap` when its architecture requires them, at the exact versions recorded here. Any other new dependency still needs the deviation protocol.
- **Statut** : actif (effective once merged into main; until then this entry is a proposal on branch game/salati)
