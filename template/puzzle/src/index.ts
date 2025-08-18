import { resolve, relative } from "path"
import { run, type RunOptions } from "@doriongilmore/codingame-ts-engine/puzzle/Runner";
import script from "./playerScript.js";

const options: RunOptions = {
    path: resolve("exercises", "01.txt"), // run one file
    // path: resolve("exercises"), // run full folder
    hideEngineLogs: false, // this is already the default
    script,
}

run(options);
