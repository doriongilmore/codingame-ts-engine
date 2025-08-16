// import { PuzzleEngine, fromJsonFileToPuzzleData } from "@doriongilmore/codingame-ts-engine";
import { resolve } from "path"
import { readdirSync, statSync } from "fs";
import PuzzleEngine from "./Engine.js";
import { fromJsonFileToPuzzleData } from "../lib/fromJsonFileToPuzzleData.js";
import type { PuzzleScript } from "../types.js";

function isJsonFile(filename:string): boolean {
    return filename.endsWith(".json");
}

function runFile(script: PuzzleScript, path: string): boolean {
    const data = fromJsonFileToPuzzleData(path);
    const game = new PuzzleEngine(data.inputs, data.outputs, script);
    return game.run();
}

function runDirectory(script: PuzzleScript, path: string) {
    const files = readdirSync(path)
        .filter(isJsonFile)
        .map((filename:string) => resolve(path, filename));

    let count = 0;

    for (const filepath of files) {
        const success = runFile(script, filepath);;
        if (success) {
            count += 1;
        }
        console.log("");
    }

    const percentage:number = files.length ? Number(count / files.length * 100): 0;
    console.log(`won ${count} games out of ${files.length} : ${percentage}%`);
}

export function run(script: PuzzleScript, path: string = resolve("exercises")) {
    const pathStats = statSync(path);

    if (pathStats.isDirectory()) {
        runDirectory(script, path)
    } else if (pathStats.isFile() && isJsonFile(path)) {
        runFile(script, path);
    } else {
        console.error("Only JSON files and directories containing such files are supported");
    }
}