import { fromJsonFileToPuzzleData as _fromJsonFileToPuzzleData} from "./lib/fromJsonFileToPuzzleData.js";
import _PuzzleEngine from "./Puzzle/Engine.js" ;
import { run as _runPuzzle } from "./Puzzle/Runner.js" ;

import type {
    ReadlineFunction as _ReadlineFunction,
    PuzzleScript as _PuzzleScript,
    PuzzleExerciseData as _PuzzleExerciseData,
    BotScript as _BotScript,
} from "./types.js";

export type ReadlineFunction = _ReadlineFunction;
export type PuzzleScript = _PuzzleScript;
export type PuzzleExerciseData = _PuzzleExerciseData;
export type BotScript = _BotScript;

export const PuzzleEngine = _PuzzleEngine;

export const fromJsonFileToPuzzleData = _fromJsonFileToPuzzleData;

export const runPuzzle = _runPuzzle;

export type { Referee, GameResult, Plays, Winner, EliminationKind } from "./types.js";
export { default as BotEngine } from "./Bot/Engine.js";
export type { BotEngineOptions } from "./Bot/Engine.js";
export { InvalidMove } from "./Bot/InvalidMove.js";
export { run as runBot, evaluate as evaluateBot } from "./Bot/Runner.js";
export type { RunOptions as RunBotOptions, EvaluateOptions, EvaluationResult } from "./Bot/Runner.js";
export { createRandom } from "./lib/createRandom.js";
