import { type ReadlineFunction } from "../types.js";

export function getReadline(inputs: string[]): ReadlineFunction {
    let readlineCount = -1;
    const readlineMethod = function* readlineMethod(){
        while(true) { yield inputs[++readlineCount] }
    }();
    return function readline() {
        return readlineMethod.next().value;
    }
}