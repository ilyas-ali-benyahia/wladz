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

### CC-20261013-game-games-2-01 — Déplacer le module Game 2 sous le dashboard

- **Date** : 2026-10-13
- **Développeur** : ilyas-alibenyahia
- **Groupe** : game:games-2
- **Branche / PR** : game/games-2/prototype-3d — PR non créée
- **Type** : écart forcé
- **Règle(s) concernée(s)** : WLADZ_TEAM_PROMPT.md §3.2, §6.1 et §6.7 — propriété des routes Dashboard et découverte des jeux depuis `games/<slug>/`
- **Changement** : déplacer les sources du module `games/games-2/` vers `app/dashboard/games/games-2/`, sans remplacer les fichiers de route existants. L’asset reste dans `public/games/games-2/`.
- **Raison** : demande du développeur de placer Game 2 sous le segment de route du dashboard.
- **Conséquences et risques acceptés** : le registre de jeux décrit par §6.7 ne découvrira plus le manifest à son emplacement conventionnel. Le sous-dossier ne devient une route Next.js jouable qu’après ajout par Hub & Core d’un `page.tsx` qui l’héberge et fournit le contrat `GameProps`; les pages Dashboard existantes sont actuellement vides.
- **Impact sur les autres groupes** : Hub & Core doit intégrer le module au routage et adapter ou confirmer la découverte du manifest ; les autres groupes gardent leur emplacement conventionnel.
- **Action requise pour les autres** : Hub & Core doit relire cette proposition et fournir l’intégration route/host avant que la route Game 2 soit considérée comme fonctionnelle.
- **Nouvelle règle effective** : proposition limitée à Game 2 : ses sources peuvent résider sous `app/dashboard/games/games-2/`; l’asset reste sous `public/games/games-2/`. Cette règle ne prend effet qu’après merge dans `main`.
- **Statut** : actif
