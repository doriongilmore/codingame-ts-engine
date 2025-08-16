import { getReadline } from "../lib/getReadline.js";
import type { PuzzleScript } from "../types.js";

const DASHES = "------";
const FAIL = "fail";
const SUCCESS = "success";

export default class PuzzleEngine {
    constructor(public playerInputs: string[], public expectedPlayerOutput: string[], public script: PuzzleScript) {}

    run(): boolean {
        this.logStep("Game started");

        const readline = getReadline(this.playerInputs);
        const move = this.script.main(readline);
        const won:boolean = this.checkMove(move);

        this.logStep(`Game finished. Result : ${won ? SUCCESS : FAIL}`);

        return won;
    }

    private checkMove(move: string[]): boolean {
        for (let rowIndex = 0; rowIndex < this.expectedPlayerOutput.length; rowIndex++) {
            const expectedRow = this.expectedPlayerOutput[rowIndex];
            const playerRow = move[rowIndex];
            if (expectedRow !== playerRow) {
                this.warnFailure(expectedRow, playerRow)
                return false;
            }
        }

        return true;
    }

    private warnFailure(expectedRow: string, playerRow: string): void {
        // Failure
        // Found:       ###########EDCBA9876543210#
        // Expected:    #.........#EDCBA9876543210#
        console.warn("\nFailure");
        console.warn(`${"Found:".padEnd(10, " ")} ${playerRow}`);
        console.warn(`${"Expected:".padEnd(10, " ")} ${expectedRow}`);
    }

    private logStep(message: string): void {
        console.log(`${DASHES} ${message} ${DASHES}`);
    }
}
