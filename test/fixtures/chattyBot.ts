import type { ReadlineFunction } from "../../src/types.js";

/** Writes one line too many each turn */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    while (true) {
        readline();
        console.log("1");
        console.log("1");
    }
}
