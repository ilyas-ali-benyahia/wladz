# <Titre du jeu> — `app/dashboard/games/<slug>/`

> Copier ce dossier vers `app/dashboard/games/<slug>/`, puis remplir chaque section. Voir `WLADZ_TEAM_PROMPT.md` §6 et §9.

## Équipe

- Groupe : `game:<slug>`
- Membres : …

## Résumé

Une ou deux phrases : de quoi parle le jeu, que fait le joueur.

## Objectifs pédagogiques

- Ce que l'enfant doit avoir compris / retenu à la fin (reprendre `learningGoals` du manifest).

## Public

- Tranche d'âge : … (identique à `ageRange` du manifest)

## Mécanique de jeu

- Boucle de jeu, conditions de victoire / fin de partie.
- Calcul des points : comment `pointsEarned` est obtenu (≤ `maxPointsPerRun`).

## Contenu et sources

| Élément (fichier `_data/…`) | Source | Vérifié par | Date |
| --- | --- | --- | --- |
| … | … | … | … |

## Checklist de validation (avant `status: "pret"`)

- [ ] Tout le contenu est dans `_data/` et a été relu par un humain de l'équipe.
- [ ] Aucun `TODO-VERIFICATION` restant.
- [ ] Conforme à la charte de contenu (§9) : religion, culture, société.
- [ ] Testé sur mobile (360 px) et desktop, en arabe RTL.
- [ ] Sons coupables, aucune animation clignotante rapide.
- [ ] `onFinish` appelé une seule fois, minuteries et sons nettoyés au démontage.
