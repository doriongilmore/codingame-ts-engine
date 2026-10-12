import { resolve } from "path"
import { evaluate, type EvaluateOptions } from "@doriongilmore/codingame-ts-engine/bot/Runner";
import { referee, type Play, type State } from "../game/Referee.js";

const options: EvaluateOptions<State, Play> = {
    referee,
    // [script you are working on, opponent]. All counts are from the first script's point of view
    players: [
        resolve("src", "playerScript.ts"),
        resolve("src", "opponentScript.ts"),
    ],
    games: 20,
    swapSides: true, // alternate who plays first
}

evaluate(options).then(({ games, wins, losses, draws, rate, errors }) => {
    console.log(`${games} games : ${wins} wins, ${losses} losses, ${draws} draws (${Math.round(rate * 100)}% won)`);
    // a script which breaks the rules (bad output, impossible move, timeout...) loses: say why
    for (const { game, script, kind, reason } of errors) {
        console.log(`game ${game}: ${script === 0 ? "your script" : "opponent"} lost (${kind}): ${reason}`);
    }
});
