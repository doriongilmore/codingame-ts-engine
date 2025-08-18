import { readFileSync } from "fs";
import {} from "../types.js";
const SEPARATOR = "\n$DORION$\n";
const errorMessage = `Expect Text File containing raw 'inputs' & 'outputs', separated by a line containing ${SEPARATOR}`;
export function fromTextFileToPuzzleData(path) {
    try {
        const fileContent = readFileSync(path).toString("utf-8");
        const [inputs, outputs] = fileContent.split(SEPARATOR).map((filePart) => filePart.split("\n"));
        return { inputs, outputs };
    }
    catch (error) {
        console.error(error.message);
        throw new Error("Error while parsing file. " + errorMessage);
    }
}
//# sourceMappingURL=fromTextFileToPuzzleData.js.map