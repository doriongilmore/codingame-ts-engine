# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Vue d'ensemble

Module npm (`@doriongilmore/codingame-ts-engine`) qui permet de développer des puzzles et des bots CodinGame en TypeScript dans un IDE local : un moteur puzzle qui rejoue des exercices (inputs / outputs attendus), un moteur bot qui fait s'affronter des scripts selon des règles (referee), des templates de projet, et un outil de build qui produit un fichier unique collable dans CodinGame. Le dépôt contient le module lui-même, pas un puzzle.

## Commandes

- `npm run build` : `tsc` vers `dist/` (rootDir `src`; `bin/`, `template/` et `test/` sont exclus de la compilation).
- `npm run dev:puzzle` / `npm run dev:puzzle:multi` : copie `template.package.json` dans le template (`template/puzzle` ou `template/puzzle.multifile`), y fait `npm install` (dépendance `file:../..`) puis lance `tsx src/index.ts`. C'est le moyen de tester le moteur de bout en bout.
- `npm run build:puzzle` / `build:puzzle:multi` : lance `bin/buildForCodingame.ts` sur le template et écrit dans `<template>/codingame/playerScript.ts`.
- `npm run dev:bot` / `build:bot` / `evaluate:bot` : idem sur `template/bot` (une partie, build, ou N parties contre l'adversaire).
- `CG_PATH=./chemin npm run _dev` / `_build` : cibler un autre projet. Les installs utilisent `--install-links=false` (lien symbolique) : sans cela, un `install-links=true` global copie le moteur et les modifications ne sont plus vues.
- `npm test` : `node --test` via tsx sur `test/**/*.test.ts` (moteur bot avec de vrais processus, template bot). Un seul fichier : `node --import tsx --test test/bot.test.ts`.

## Architecture

- `src/index.ts` : API publique réexportée. `package.json` `exports` expose aussi `./types`, `./puzzle/*`, `./bot/*` et `./lib/*` directement sur les `.ts` de `src` (les templates importent `@doriongilmore/codingame-ts-engine/puzzle/Runner`, `.../bot/Runner` ou `.../lib/createRandom`, pas `dist`). Il n'y a pas d'entrée racine `"."` : `src/index.ts` n'est pas importable par un consommateur. Les imports internes utilisent l'extension `.js` (ESM `module: node18`, `verbatimModuleSyntax`, donc `import type` obligatoire pour les types).
- `src/Puzzle/Runner.ts` : `run({path, script, hideEngineLogs})` accepte un fichier ou un dossier (`.json` ou `.txt`) et affiche le score `won X games out of Y`.
- `src/Puzzle/Engine.ts` : `PuzzleEngine` exécute `script.main(readline)` et compare les lignes retournées aux sorties attendues.
- `src/lib/` : `getReadline` (simule le `readline()` de CodinGame via un générateur), parseurs d'exercices, `createRandom` (PRNG à graine pour les referees). Format `.json` : `{inputs, outputs}`. Format `.txt` : inputs et outputs séparés par la ligne `$DORION$`.
- `src/types.ts` : contrats `PuzzleScript = { main(readline): string[] }`, `BotScript = { main(readline): void }` (le script exporte `API` par défaut) et `Referee<State>`.
- `src/Bot/` : moteur de bots (voir section suivante).
- `template/puzzle` (fichier unique), `template/puzzle.multifile` (plusieurs fichiers locaux) et `template/bot` (morpion : referee + bot + adversaire) : copiés par l'utilisateur dans son projet. Le dossier `codingame/` contient la sortie du build.

## Moteur de bots (`src/Bot`)

- Contrat : `Referee<State, Play>` dans `src/types.ts` (calqué sur les referees CodinGame : `init`, inputs d'init et de tour par joueur, `activePlayers`, `expectedOutputLines`, `parsePlay`, `validatePlay`, `update`, `winner`). `activePlayers` renvoie 1 joueur (séquentiel) ou plusieurs (simultané). Les règles vivent dans le projet utilisateur (`template/bot/game/Referee.ts`), pas dans le module.
- Règle CodinGame reproduite : tout joueur qui ne respecte pas les règles perd. Le moteur vérifie dans l'ordre : nombre exact de lignes (en trop ou manquantes, voir `ProcessPlayer`), `parsePlay` (syntaxe, lève `InvalidMove(raison)`), `validatePlay` (règles, lève `InvalidMove`). `update` ne reçoit que des `Play` valides (les éliminés du tour sont absents de `plays`). Une autre exception levée par le referee n'est pas une faute du joueur : elle remonte (bug du referee).
- `Engine.ts` : boucle de tours asynchrone, élimination typée (`EliminationKind` : `start`, `timeout`, `crash`, `output`, `invalid`, avec la raison, exposés dans `GameResult.eliminated`). `maxTurns` compte des tours moteur (un `update` chacun), pas des manches.
- Classement (`Engine.ts` + `ranking.ts`) : le moteur note le tour où chaque joueur quitte la partie (`outAt`) : éliminations du moteur, et morts décidées par les règles via le `isOut?(state, player)` optionnel du referee (interrogé après chaque `update`). Celui qui reste le plus longtemps est premier, ceux qui sortent au même tour sont à égalité, quelle que soit la cause (`ranks[player]`, 1 = meilleur, `1, 2, 2, 4`). Parmi ceux encore en jeu à la fin : le gagnant du referee d'abord, puis `scores?(state)` optionnel (plus haut = mieux), sinon égalité. `GameResult.winner` est dérivé des rangs (un seul premier = ce joueur, sinon `"draw"`) ; solo : `winner` reste celui du referee. Sans `isOut`, les morts internes sont invisibles pour le moteur.
- `ProcessPlayer.ts` + `host.ts` : chaque bot est un processus `node --import tsx host.ts <script>`. `host.ts` fournit le `readline()` global synchrone (`readSync` sur stdin, EAGAIN géré) puis appelle `default.main(readline)`, ou laisse un script construit s'exécuter à l'import. Protocole sur stdout (`protocol.ts`) : `READY_MARKER` avant de charger le script (le chargement compte dans le timeout du premier tour) ; `@@...:idle:<n>@@` à chaque fois que `readline()` va bloquer, avec `n` lignes consommées. Quand `n` égale le nombre de lignes envoyées, le script a fini son tour : tout ce qu'il a écrit avant est sa réponse, qui doit faire exactement `expectedOutputLines` lignes. Un script qui ne lit pas toutes ses entrées n'est jamais "idle" : sa réponse est jugée au timeout. stderr du bot = debug, préfixé et relayé.
- `Runner.ts` : `run` (une partie), `evaluate` (2 scripts, N parties, côtés alternés) et `compete` (2 scripts ou plus dans la même partie, sièges tournés : rang moyen, histogramme des rangs, victoires, points `N - rang`). `evaluate` et `compete` partagent `playSeries` : la graine est `seed + tour de rotation` (les N rotations d'un tour jouent la même carte), et `winner`, `eliminated`, `ranks` des résultats sont donnés par script (index dans `players`), pas par siège.
- Les scripts bot ont la même forme que les scripts puzzle (`const API: BotScript = { main }`), `main` contient la boucle `while (true)`. Le build les traite à l'identique.

## Build CodinGame (`bin/buildForCodingame.ts`)

Transformation textuelle, ligne par ligne, du `playerScript.ts` :
- suit récursivement les imports relatifs (`./...`), inline le contenu des fichiers (une seule fois chacun, déduplication par `alreadyImported`, un état global) ;
- supprime les imports et les lignes du moteur (`knownEngineLines`, bloc de commentaire `toBeRemoved`), retire `export` ;
- décommente `// main(readline);`.

Contraintes : les lignes marqueurs doivent rester identiques au texte des templates (toute modification du commentaire d'en-tête d'un template doit être répercutée dans `toBeRemoved`, et toute nouvelle forme de `const API: X = { main };` dans `knownEngineLines`) ; seuls les imports relatifs sur une ligne sont supportés (regex `import X from "./..."`).

## Pièges

- `dist/` est versionné et régénéré par la CI de release (commit `chore: update dist folder`) : ne pas le modifier à la main.
- `template/**/package.json` est gitignoré (généré par `_dev`). Sa présence rend les fichiers du template CJS pour Node natif (pas de `"type"`) : les tests en tiennent compte.
- Dans un processus lancé par tsx, `import.meta.resolve` n'existe pas : utiliser `createRequire(import.meta.url).resolve(...)`.
- Release : workflow GitHub manuel (`.github/workflows/release.yml`) avec `bump-release-action`; la version est lue/écrite dans `package.json` (ligne 3) et `package-lock.json` (lignes 3 et 9). Les préfixes de commit (`feat:`, `fix:`, `change:`, `ci:`, `chore:`, `docs:`, `breaking:`) pilotent les notes de version et le bump (`feat:` = minor, `breaking:` = major, sinon patch).
