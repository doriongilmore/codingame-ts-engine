# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Vue d'ensemble

Module npm (`@doriongilmore/codingame-ts-engine`) qui permet de développer des puzzles CodinGame en TypeScript dans un IDE local : un moteur qui rejoue des exercices (inputs / outputs attendus), des templates de projet, et un outil de build qui produit un fichier unique collable dans CodinGame. Le dépôt contient le module lui-même, pas un puzzle.

## Commandes

- `npm run build` : `tsc` vers `dist/` (rootDir `src`; `bin/` et `template/` sont exclus de la compilation).
- `npm run dev:puzzle` / `npm run dev:puzzle:multi` : copie `template.package.json` dans le template (`template/puzzle` ou `template/puzzle.multifile`), y fait `npm install` (dépendance `file:../..`) puis lance `tsx src/index.ts`. C'est le moyen de tester le moteur de bout en bout.
- `npm run build:puzzle` / `build:puzzle:multi` : lance `bin/buildForCodingame.ts` sur le template et écrit dans `<template>/codingame/playerScript.ts`.
- `CG_PATH=./chemin npm run _dev` / `_build` : cibler un autre projet.
- `npm test` : pas de test (placeholder qui échoue), la CI l'exécute quand même.

## Architecture

- `src/index.ts` : API publique réexportée. `package.json` `exports` expose aussi `./types` et `./puzzle/*` directement sur les `.ts` de `src` (les templates importent `@doriongilmore/codingame-ts-engine/puzzle/Runner`, pas `dist`). Les imports internes utilisent l'extension `.js` (ESM `module: node18`, `verbatimModuleSyntax`, donc `import type` obligatoire pour les types).
- `src/Puzzle/Runner.ts` : `run({path, script, hideEngineLogs})` accepte un fichier ou un dossier (`.json` ou `.txt`) et affiche le score `won X games out of Y`.
- `src/Puzzle/Engine.ts` : `PuzzleEngine` exécute `script.main(readline)` et compare les lignes retournées aux sorties attendues.
- `src/lib/` : `getReadline` (simule le `readline()` de CodinGame via un générateur), parseurs d'exercices. Format `.json` : `{inputs, outputs}`. Format `.txt` : inputs et outputs séparés par la ligne `$DORION$`.
- `src/types.ts` : contrat joueur `PuzzleScript = { main(readline): string[] }` (le script exporte `API` par défaut).
- `template/puzzle` (fichier unique) et `template/puzzle.multifile` (plusieurs fichiers locaux) : copiés par l'utilisateur dans son projet. Le dossier `codingame/` contient la sortie du build.

## Build CodinGame (`bin/buildForCodingame.ts`)

Transformation textuelle, ligne par ligne, du `playerScript.ts` :
- suit récursivement les imports relatifs (`./...`), inline le contenu des fichiers (une seule fois chacun, déduplication par `alreadyImported`, un état global) ;
- supprime les imports et les lignes du moteur (`knownEngineLines`, bloc de commentaire `toBeRemoved`), retire `export` ;
- décommente `// main(readline);`.

Contraintes : les lignes marqueurs doivent rester identiques au texte des templates (toute modification du commentaire d'en-tête d'un template doit être répercutée dans `toBeRemoved`) ; seuls les imports relatifs sur une ligne sont supportés (regex `import X from "./..."`).

## Pièges

- `dist/` est versionné et régénéré par la CI de release (commit `chore: update dist folder`) : ne pas le modifier à la main.
- `template/**/package.json` est gitignoré (généré par `_dev`).
- Release : workflow GitHub manuel (`.github/workflows/release.yml`) avec `bump-release-action`; la version est lue/écrite dans `package.json` (ligne 3) et `package-lock.json` (lignes 3 et 9). Les préfixes de commit (`feat:`, `fix:`, `change:`, `ci:`, `chore:`, `docs:`, `breaking:`) pilotent les notes de version et le bump (`feat:` = minor, `breaking:` = major, sinon patch).
