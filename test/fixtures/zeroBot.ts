import type { ReadlineFunction } from "../../src/types.js";

/** Always answers 0 (a "death" for the survival referee) */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    while (true) {
        readline();
        console.log("0");
    }
}
