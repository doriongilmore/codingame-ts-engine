import type { BotScript } from "@doriongilmore/codingame-ts-engine/types";

/**
 * An opponent to evaluate your playerScript against: plays a random valid move.
 * It can be replaced by a previous version of your own script.
 */
const API: BotScript = { main };
export default API;

type ReadlineFunction = () => string

function main(readline: ReadlineFunction): void {
    while (true) {
        readline(); // opponent last move
        const validActionCount: number = parseInt(readline());
        const moves: string[] = [];
        for (let i = 0; i < validActionCount; i++) {
            moves.push(readline());
        }
        console.log(moves[Math.floor(Math.random() * moves.length)]);
    }
}
