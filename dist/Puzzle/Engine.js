import { getReadline } from "../lib/getReadline.js";
const DASHES = "------";
const FAIL = "fail";
const SUCCESS = "success";
export default class PuzzleEngine {
    constructor(playerInputs, expectedPlayerOutput, script) {
        this.playerInputs = playerInputs;
        this.expectedPlayerOutput = expectedPlayerOutput;
        this.script = script;
    }
    run() {
        this.logStep("Game started");
        const move = this.script.main(getReadline(this.playerInputs));
        const won = this.checkMove(move);
        this.logStep(`Game finished. Result : ${won ? SUCCESS : FAIL}`);
    }
    checkMove(move) {
        for (let rowIndex = 0; rowIndex < this.expectedPlayerOutput.length; rowIndex++) {
            const expectedRow = this.expectedPlayerOutput[rowIndex];
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
        console.warn("Failure");
        console.warn(`${"Found:".padEnd(10, " ")} ${playerRow}`);
        console.warn(`${"Expected:".padEnd(10, " ")} ${expectedRow}`);
    }
    logStep(message) {
        console.log(`${DASHES} ${message} ${DASHES}`);
    }
}
//# sourceMappingURL=Engine.js.map