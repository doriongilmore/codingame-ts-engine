import { readFileSync } from "fs"
import { PuzzleExerciseData } from "../types";

const errorMessage = "Expect JSON object with 'inputs' && 'outputs' properties";

export function fromJsonFileToPuzzleData(path: string): PuzzleExerciseData {
    try {
        const fileContent = readFileSync(path).toString("utf-8");
        const data = JSON.parse(fileContent);
        if (data.inputs && data.outputs) {
            return data;
        }
        throw new Error("Invalid Format: " + errorMessage);
    } catch (error) {
        console.error(error.message);
        throw new Error("Error while parsing file. " + errorMessage);
    }
}
