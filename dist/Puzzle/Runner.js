import { resolve } from "path";
import { readdirSync, statSync } from "fs";
import PuzzleEngine from "./Engine.js";
import { fromJsonFileToPuzzleData } from "../lib/fromJsonFileToPuzzleData.js";
import { fromTextFileToPuzzleData } from "../lib/fromTextFileToPuzzleData.js";
function isJsonFile(filename) {
    return filename.endsWith(".json");
}
function isTextFile(filename) {
    return filename.endsWith(".txt");
}
function hasSupportedExtension(filename) {
    return isJsonFile(filename) || isTextFile(filename);
}
function readFile(path) {
    if (isJsonFile(path)) {
        return fromJsonFileToPuzzleData(path);
    }
    else if (isTextFile(path)) {
        return fromTextFileToPuzzleData(path);
    }
    throw new Error("wrong extension for file: " + path);
}
function runFile(options) {
    const data = readFile(options.path);
    const gameOptions = {
        playerInputs: data.inputs,
        expectedPlayerOutput: data.outputs,
        script: options.script,
        hideEngineLogs: options.hideEngineLogs,
    };
    const game = new PuzzleEngine(gameOptions);
    return game.run();
}
function runDirectory(options) {
    const files = readdirSync(options.path)
        .filter(hasSupportedExtension)
        .map((filename) => resolve(options.path, filename));
    let count = 0;
    for (const filepath of files) {
        const fileRunOptions = { ...options, path: filepath };
        const success = runFile(fileRunOptions);
        if (success) {
            count += 1;
        }
        !options.hideEngineLogs && console.log("");
    }
    const percentage = files.length ? Number(count / files.length * 100) : 0;
    console.log(`won ${count} games out of ${files.length} : ${percentage}%`);
}
export function run(options) {
    const pathStats = statSync(options.path);
    if (pathStats.isDirectory()) {
        runDirectory(options);
    }
    else if (pathStats.isFile() && hasSupportedExtension(options.path)) {
        runFile(options);
    }
    else {
        console.error("Only JSON or TXT files and directories containing such files are supported.");
    }
}
//# sourceMappingURL=Runner.js.map