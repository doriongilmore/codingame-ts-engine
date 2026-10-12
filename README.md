# CodinGame Engine

## Introduction

This is a node module to easily work/play with typescript on different CodinGame projects: classic puzzles (input - compute - output) and bot battles (turns, opponents).

## Goal / Idea

We should be able to create a new project and npm install this one, which would allow you to play CodinGame with your favorite IDE by :

- creating a template with 
    - "README" file (to put game rules)
    - "exercises" folder (to put games data), 
- provide a few helpers (e.g. `readline()`)


## Installation

- Install the dependencies:
```bash
npm i @types/node@22 tsx@4 typescript@5 @doriongilmore/codingame-ts-engine
```
- Copy one of the templates:
    - `cp node_modules/@doriongilmore/codingame-ts-engine/template/puzzle/* -r .`
    - `cp node_modules/@doriongilmore/codingame-ts-engine/template/puzzle.multifile/* -r .`
- Then add the following scripts to your package.json:
```json
"dev": "tsx src/index.ts",
"build": "npx tsx node_modules/.bin/buildForCodingame.ts"
```

After executing your new dev script, you should see the following in console:
```
~/workspace/new-cg-game$ npm run dev

> new-cg-game@1.0.0 dev
> tsx src/index.ts

------ Game started ------
answer
answer
answer
answer
answer

Failure
Found:     answer
Expected:  ##########
------ Game finished. Result : fail ------
```

If that's the case, you're ready to work on your puzzle! Start by looking into
- `src/playerScript.js` (your player logic)
- `src/index.ts` (mechanism to run one or several puzzles)
- `exercises` you should update files for your current puzzle

## Bot battles

Copy `template/bot` instead of a puzzle template. It contains:
- `game/Referee.ts`: the rules of the game (the sample is a Tic Tac Toe, replace it with your game)
- `src/playerScript.ts`: your bot, written like on CodinGame (same build tool as puzzles)
- `src/opponentScript.ts`: an opponent (random moves, or an older version of your bot)
- `src/index.ts` plays one game, `src/evaluate.ts` plays several games and prints your win rate

Add these scripts to your package.json:
```json
"dev": "tsx src/index.ts",
"evaluate": "tsx src/evaluate.ts",
"build": "npx tsx node_modules/.bin/buildForCodingame.ts"
```

Each bot runs in its own node process: it reads with the global synchronous `readline()` and answers with `console.log`, exactly as on CodinGame. What it writes with `console.error` is displayed with its player name.
A bot is eliminated (and the other player wins) when it answers too slowly (`turnTimeoutMs`, `firstTurnTimeoutMs`), crashes, or when your referee throws an `InvalidMove`.

## Example

Check the following for a complete implementation:
- [Puzzle Solution](https://github.com/doriongilmore/cg-moves-in-maze)

## Roadmap

- framework for classic puzzles (input - compute - output) ✅
    - "init" a run with inputs and expected outputs ✅
    - simulate "readline" codingame utility ✅
    - compare player output vs expected output ✅
- build tool ✅
    - basic usage (remove engine parts & uncomment `main(readline)` call) ✅
    - add support for custom imports ✅
- node module ✅
    - export utilities from 1 & 2 ✅
    - create specific architecture during installation (see /template folder) ✅
- framework for bot battles ✅
    - referee interface (sequential or simultaneous games) ✅
    - every bot runs in its own process with a CodinGame-like global `readline()` ✅
    - invalid move / timeout / crash elimination ✅
    - `evaluate` N games between two scripts ✅
- framework for more advanced games (replays, viewer) ⏳
