import type { ReadlineFunction } from "../../src/types.js";

/** Reads its inputs then computes forever */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    readline();
    while (true) {
        // busy loop
    }
}
