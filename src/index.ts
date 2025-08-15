import { fromJsonFileToPuzzleData as _fromJsonFileToPuzzleData} from "./lib/fromJsonFileToPuzzleData.js";
import _PuzzleEngine from "./Puzzle/Engine.js" ;
import { run as _runPuzzle } from "./Puzzle/Runner.js" ;

import type {
    ReadlineFunction as _ReadlineFunction,
    PuzzleScript as _PuzzleScript,
    PuzzleExerciseData as _PuzzleExerciseData,
} from "./types.js";

export type ReadlineFunction = _ReadlineFunction;
export type PuzzleScript = _PuzzleScript;
export type PuzzleExerciseData = _PuzzleExerciseData;

export const PuzzleEngine = _PuzzleEngine;

export const fromJsonFileToPuzzleData = _fromJsonFileToPuzzleData;

export const runPuzzle = _runPuzzle;
