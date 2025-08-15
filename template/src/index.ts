import { resolve } from "path"
import { runPuzzle } from "@doriongilmore/codingame-ts-engine";
import script from "./playerScript.js";

// const oneFile = resolve("exercises", "01.json");
// runPuzzle(script, oneFile);

const folder = resolve("exercises");
runPuzzle(script, folder);