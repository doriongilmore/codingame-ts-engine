import { getReadline } from "../lib/getReadline.js";
const DASHES = "------";
const FAIL = "fail";
const SUCCESS = "success";
export default class PuzzleEngine {
    constructor(options) {
        this.options = options;
    }
    run() {
        this.logStep("Game started");
        const readline = getReadline(this.options.playerInputs);
        const move = this.options.script.main(readline);
        const won = this.checkMove(move);
        this.logStep(`Game finished. Result : ${won ? SUCCESS : FAIL}`);
        return won;
    }
    checkMove(move) {
        for (let rowIndex = 0; rowIndex < this.options.expectedPlayerOutput.length; rowIndex++) {
            const expectedRow = this.options.expectedPlayerOutput[rowIndex];
            const playerRow = move[rowIndex];
            if (expectedRow !== playerRow) {
                this.warnFailure(expectedRow, playerRow);
                return false;
            }
        }
        return true;
    }
    warnFailure(expectedRow, playerRow) {
        // Failure
        // Found:       ###########EDCBA9876543210#
        // Expected:    #.........#EDCBA9876543210#
        console.warn("\nFailure");
        console.warn(`${"Found:".padEnd(10, " ")} ${playerRow}`);
        console.warn(`${"Expected:".padEnd(10, " ")} ${expectedRow}`);
    }
    logStep(message) {
        if (!this.options.hideEngineLogs) {
            console.log(`${DASHES} ${message} ${DASHES}`);
        }
    }
}
//# sourceMappingURL=Engine.js.map