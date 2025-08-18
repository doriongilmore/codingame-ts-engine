# CodinGame Engine

## Introduction

This is a node module to easily work/play with typescript on different CodinGame projects (classic puzzles or bot battles)

## Goal / Idea

We should be able to create a new project and npm install this one, which would allow you to play CodinGame with your favorite IDE by :

- creating a template with 
    - "README" file (to put game rules)
    - "exercises" folder (to put games data), 
- provide a few helpers (e.g. `readline()`)


## Installation

- execute the following:
```bash
npm i @types/node@22 tsx@4 typescript@5 @doriongilmore/codingame-ts-engine
cp node_modules/@doriongilmore/codingame-ts-engine/template/puzzle/* -r .
```
- add the following scripts to your package.json
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
- `exercises` you should update json files for your current puzzle

## Example

Check the following for a complete implementation:
- [Puzzle Solution](https://github.com/doriongilmore/cg-moves-in-maze)

## Roadmap

- framework for classic puzzles (input - compute - output) ✅
    - "init" a run with inputs and expected outputs ✅
    - simulate "readline" codingame utility ✅
    - compare player output vs expected output ✅
- build tool ⏳
- node module
    - export utilities from 1 & 2 ✅
    - create specific architecture during installation (see /template folder) ⏳
- framework for more advanced games ⏳
