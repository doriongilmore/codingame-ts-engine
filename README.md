# CodinGame Engine

## Introduction

This is a node module to easily work/play with typsecript on different CodinGame projects (classic puzzles or bot battles)

## Goal / Idea

We should be able to create a new project and npm install this one, which would allow you to play CodinGame with your favorite IDE by :

- creating a template with 
    - "README" file (to put game rules)
    - "exercises" folder (to put games data), 
- provide a few helpers (e.g. `readline()`)


## Installation

`npm i @types/node@22 tsx@4 typescript@5 @doriongilmore/codingame-ts-engine`

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
