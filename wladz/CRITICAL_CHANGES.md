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
