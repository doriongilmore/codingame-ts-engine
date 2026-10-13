import type { ReadlineFunction } from "../../src/types.js";

/** Always answers 1 */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    while (true) {
        readline();
        console.log("1");
    }
}
