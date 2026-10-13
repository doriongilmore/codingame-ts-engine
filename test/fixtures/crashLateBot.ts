import type { ReadlineFunction } from "../../src/types.js";

/** Answers the first turn, throws on the second one */
const API = { main };
export default API;

function main(readline: ReadlineFunction): void {
    readline();
    console.log("1");
    readline();
    throw new Error("late boom");
}
