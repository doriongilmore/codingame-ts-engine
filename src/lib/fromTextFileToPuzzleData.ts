import { readFileSync } from "fs"
import { type PuzzleExerciseData } from "../types.js";

const SEPARATOR = "\n$DORION$\n";
const errorMessage = `Expect Text File containing raw 'inputs' & 'outputs', separated by a line containing ${SEPARATOR}`;

export function fromTextFileToPuzzleData(path: string): PuzzleExerciseData {
    try {
        const fileContent = readFileSync(path).toString("utf-8");
        const [inputs, outputs]: string[][] = fileContent.split(SEPARATOR).map((filePart) => filePart.split("\n"));

        console.debug({ inputs, outputs });

        return { inputs, outputs };
    } catch (error) {
        console.error((error as Error).message);
        throw new Error("Error while parsing file. " + errorMessage);
    }
}
