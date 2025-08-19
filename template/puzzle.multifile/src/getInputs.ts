import { ReadlineFunction } from "./types";
export default function getInputs(readline: ReadlineFunction) {
    var rawInputs: string[] = readline().split(' ');
    const w: number = parseInt(rawInputs[0]);
    const h: number = parseInt(rawInputs[1]);
    const inputs: string[] = [];
    for (let i = 0; i < h; i++) {
        const ROW: string = readline();
        console.error(ROW); // this helps you create txt files for your local environment, remove anytime
        inputs.push(ROW)
    }
    console.error("$DORION$"); // this helps you create txt files for your local environment, remove anytime
    return inputs;
}
