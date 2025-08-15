// import { PuzzleEngine, fromJsonFileToPuzzleData } from "@doriongilmore/codingame-ts-engine";
import { resolve } from "path";
import { readdirSync, statSync } from "fs";
import PuzzleEngine from "./Engine.js";
import { fromJsonFileToPuzzleData } from "../lib/fromJsonFileToPuzzleData.js";
function isJsonFile(filename) {
    return filename.endsWith(".json");
}
function runFile(script, path) {
    // console.debug("file detected", path);
    const data = fromJsonFileToPuzzleData(path);
    const game = new PuzzleEngine(data.inputs, data.outputs, script);
    game.run();
}
function runDirectory(script, path) {
    // console.debug("directory detected", path);
    const files = readdirSync(path)
        .filter(isJsonFile)
        .map((filename) => resolve(path, filename));
    // console.debug(files.length, "json files detected");
    for (const filepath of files) {
        runFile(script, filepath);
        console.log("");
    }
}
export function run(script, path = resolve("exercises")) {
    const pathStats = statSync(path);
    if (pathStats.isDirectory()) {
        runDirectory(script, path);
    }
    else if (pathStats.isFile() && isJsonFile(path)) {
        runFile(script, path);
    }
    else {
        console.error("Only JSON files and directories containing such files are supported");
    }
}
//# sourceMappingURL=Runner.js.map