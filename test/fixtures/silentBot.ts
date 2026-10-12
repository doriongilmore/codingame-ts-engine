import type { ReadlineFunction } from "../../src/types.js";

/** Reads its inputs but never answers */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    while (true) {
        readline();
    }
}
