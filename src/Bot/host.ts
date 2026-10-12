/**
 * Entry point of a player process (started by ProcessPlayer, not meant to be imported).
 * It provides CodinGame's global, synchronous `readline()` on top of stdin, then loads the script.
 * - script with a default export `{ main }` (src/playerScript.ts): `main(readline)` is called
 * - built script (codingame/playerScript.ts): it calls `main(readline)` by itself on import
 */
import { readSync } from "fs";
import { resolve } from "path";
import { pathToFileURL } from "url";
import { READY_MARKER } from "./protocol.js";

const chunk = Buffer.alloc(64 * 1024);
let buffer = "";

function readline(): string {
    for (;;) {
        const index = buffer.indexOf("\n");
        if (index >= 0) {
            const line = buffer.slice(0, index).replace(/\r$/, "");
            buffer = buffer.slice(index + 1);
            return line;
        }
        let count = 0;
        try {
            count = readSync(0, chunk, 0, chunk.length, null);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code === "EAGAIN") {
                continue; // non blocking pipe with nothing to read yet
            }
            if (code !== "EOF") {
                throw error;
            }
        }
        if (count === 0) {
            process.exit(0); // the engine closed our stdin: game is over
        }
        buffer += chunk.toString("utf8", 0, count);
    }
}

(globalThis as Record<string, unknown>).readline = readline;

console.log(READY_MARKER);

const scriptPath = process.argv[2];
if (!scriptPath) {
    console.error("host: missing script path");
    process.exit(1);
}

const loaded = await import(pathToFileURL(resolve(scriptPath)).href);
if (typeof loaded.default?.main === "function") {
    loaded.default.main(readline);
}
