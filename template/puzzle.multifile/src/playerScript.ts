/**
 * Auto-generated code below aims at helping you use
 * codingame-ts-engine. You can see the Auto-generated code
 * from codingame in `main` function.
 *
 * The beginning of this file until `export default API;` (included)
 * must be removed before copy-pasting to CodinGame
 * You should also remember to uncomment the last line `main(readline);`
 **/
import { PuzzleScript } from "@doriongilmore/codingame-ts-engine/types";
import type { ReadlineFunction } from "./types";
import getInputs from "./getInputs";
const API: PuzzleScript = { main };
export default API;
// everything until this line must be removed in CodinGame

function main(readline: ReadlineFunction): string[] {
    /**
     * Auto-generated code below aims at helping you parse
     * the standard input according to the problem statement.
     **/
    const answer: string[] = []
    const inputs: string[] = getInputs(readline);
    for (let i = 0; i < inputs.length; i++) {

        // Write an answer using console.log()
        // To debug: console.error('Debug messages...');
        answer.push("answer")
        console.log('answer');
    }
    return answer;
}

// main(readline);
