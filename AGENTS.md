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

- `src/index.ts` : API publique réexportée. `package.json` `exports` expose aussi `./types`, `./puzzle/*` et `./bot/*` directement sur les `.ts` de `src` (les templates importent `@doriongilmore/codingame-ts-engine/puzzle/Runner` ou `.../bot/Runner`, pas `dist`). Les imports internes utilisent l'extension `.js` (ESM `module: node18`, `verbatimModuleSyntax`, donc `import type` obligatoire pour les types).
- `src/Puzzle/Runner.ts` : `run({path, script, hideEngineLogs})` accepte un fichier ou un dossier (`.json` ou `.txt`) et affiche le score `won X games out of Y`.
- `src/Puzzle/Engine.ts` : `PuzzleEngine` exécute `script.main(readline)` et compare les lignes retournées aux sorties attendues.
- `src/lib/` : `getReadline` (simule le `readline()` de CodinGame via un générateur), parseurs d'exercices, `createRandom` (PRNG à graine pour les referees). Format `.json` : `{inputs, outputs}`. Format `.txt` : inputs et outputs séparés par la ligne `$DORION$`.
- `src/types.ts` : contrats `PuzzleScript = { main(readline): string[] }`, `BotScript = { main(readline): void }` (le script exporte `API` par défaut) et `Referee<State>`.
- `src/Bot/` : moteur de bots (voir section suivante).
- `template/puzzle` (fichier unique), `template/puzzle.multifile` (plusieurs fichiers locaux) et `template/bot` (morpion : referee + bot + adversaire) : copiés par l'utilisateur dans son projet. Le dossier `codingame/` contient la sortie du build.

## Moteur de bots (`src/Bot`)

- Contrat : `Referee<State>` dans `src/types.ts` (calqué sur les referees CodinGame : `init`, inputs d'init et de tour par joueur, `activePlayers`, `expectedOutputLines`, `update`, `winner`). `activePlayers` renvoie 1 joueur (séquentiel) ou plusieurs (simultané). Les règles vivent dans le projet utilisateur (`template/bot/game/Referee.ts`), pas dans le module. `update` lève `InvalidMove(player, raison)` pour éliminer un joueur ; il reçoit seulement les sorties des joueurs qui ont répondu.
- `Engine.ts` : boucle de tours asynchrone, élimination (timeout, crash, coup invalide), vainqueur = `number | "draw" | null`. `maxTurns` compte des tours moteur (un `update` chacun), pas des manches.
- `ProcessPlayer.ts` + `host.ts` : chaque bot est un processus `node --import tsx host.ts <script>`. `host.ts` fournit le `readline()` global synchrone (`readSync` sur stdin, EAGAIN géré) puis appelle `default.main(readline)`, ou laisse un script construit s'exécuter à l'import. Poignée de main : `READY_MARKER` sur stdout avant de charger le script (le chargement compte dans le timeout du premier tour). stderr du bot = debug, préfixé et relayé.
- `Runner.ts` : `run` (une partie) et `evaluate` (N parties, côtés alternés, graine `seed + n`, résultats du point de vue de `players[0]`).
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
