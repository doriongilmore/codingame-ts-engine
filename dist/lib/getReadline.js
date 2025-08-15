import {} from "../types.js";
export function getReadline(inputs) {
    let readlineCount = -1;
    const readlineMethod = function* readlineMethod() {
        while (true) {
            yield inputs[++readlineCount];
        }
    }();
    return function readline() {
        return readlineMethod.next().value;
    };
}
//# sourceMappingURL=getReadline.js.map