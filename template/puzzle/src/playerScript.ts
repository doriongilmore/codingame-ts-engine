
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

const API: PuzzleScript = { main };
export default API;
// everything until this line must be removed in CodinGame

type ReadlineFunction = () => string

function main(readline: ReadlineFunction): string[] {
    /**
     * Auto-generated code below aims at helping you parse
     * the standard input according to the problem statement.
     **/
    const answer: string[] = []
    var inputs: string[] = readline().split(' ');
    const w: number = parseInt(inputs[0]);
    const h: number = parseInt(inputs[1]);
    for (let i = 0; i < h; i++) {
        const ROW: string = readline();
        console.error(ROW); // this helps you create txt files for your local environment, remove anytime
    }
    console.error("$DORION$"); // this helps you create txt files for your local environment, remove anytime
    for (let i = 0; i < h; i++) {

        // Write an answer using console.log()
        // To debug: console.error('Debug messages...');
        answer.push("answer")
        console.log('answer');
    }
    return answer;
}

// main(readline);
