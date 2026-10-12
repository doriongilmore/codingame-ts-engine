import type { ReadlineFunction } from "../../src/types.js";

/** Throws as soon as it gets its first inputs */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    readline();
    console.error("about to crash");
    throw new Error("boom");
}
