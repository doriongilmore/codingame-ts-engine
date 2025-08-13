import { fromJsonFileToPuzzleData as _fromJsonFileToPuzzleData} from "./src/lib/fromJsonFileToPuzzleData";
import _PuzzleEngine from "./src/Puzzle/Engine" ;
import { run as _runPuzzle } from "./src/Puzzle/Runner" ;

import {
    ReadlineFunction as _ReadlineFunction,
    PuzzleScript as _PuzzleScript,
    PuzzleExerciseData as _PuzzleExerciseData,
} from "./src/types";

export type ReadlineFunction = _ReadlineFunction;
export type PuzzleScript = _PuzzleScript;
export type PuzzleExerciseData = _PuzzleExerciseData;

export const PuzzleEngine = _PuzzleEngine;

export const fromJsonFileToPuzzleData = _fromJsonFileToPuzzleData;

export const runPuzzle = _runPuzzle;
