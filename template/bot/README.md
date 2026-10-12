/!\\ This is a template, you should remove this line and update/adapt below information. This file is purely informative. /!\\

# GameName (bot battle)

## Introduction

- [See Github link](https://github.com/doriongilmore/codingame-ts-engine)
- [See CodinGame link](https://www.codingame.com/multiplayer/bot-programming/tic-tac-toe)

## Rules

### Goal

\<Put Game's Goal Description here>

### Detail

#### Input
\<Put Input Description here (initialisation, then each turn)>

#### Output
\<Put Output Description here>

#### Constraints
\<Put Constraints here (turn count, response time)>

## Project

- `game/Referee.ts`: implements the rules above for the local engine (inputs given to each player, validation of outputs, winner)
- `src/playerScript.ts`: your bot
- `src/opponentScript.ts`: the opponent
- `npm run dev`: play one game, `npm run evaluate`: play 20 games and display your win rate
