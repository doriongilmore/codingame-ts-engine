import { resolve } from "path"
import { run, type RunOptions } from "@doriongilmore/codingame-ts-engine/bot/Runner";
import { referee, type State } from "../game/Referee.js";

const options: RunOptions<State> = {
    referee,
    players: [
        resolve("src", "playerScript.ts"),
        resolve("src", "opponentScript.ts"), // or your playerScript against itself
    ],
    seed: 1, // makes the game reproducible if your referee uses `createRandom`
    hideEngineLogs: false, // this is already the default
    showPlayerLogs: true, // what your scripts write with console.error, this is already the default
    // turnTimeoutMs: Infinity, // when debugging with breakpoints
}

run(options).then((result) => console.log(result));
