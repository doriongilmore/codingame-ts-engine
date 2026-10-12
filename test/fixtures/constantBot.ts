import type { ReadlineFunction } from "../../src/types.js";

/** Reads one line per turn and always answers the value of env BOT_VALUE */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    while (true) {
        readline();
        console.log(process.env.BOT_VALUE ?? "1");
    }
}
