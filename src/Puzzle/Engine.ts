import { getReadline } from "../lib/getReadline.js";
import type { PuzzleScript } from "../types.js";

const DASHES = "------";
const FAIL = "fail";
const SUCCESS = "success";

export interface PuzzleEngineOptions {
    playerInputs: string[],
    expectedPlayerOutput: string[],
    script: PuzzleScript,
    hideEngineLogs?: boolean,
}

export default class PuzzleEngine {
    constructor(public options: PuzzleEngineOptions) {}

    run(): boolean {
        this.logStep("Game started");

        const readline = getReadline(this.options.playerInputs);
        const move = this.options.script.main(readline);
        const won:boolean = this.checkMove(move);

        this.logStep(`Game finished. Result : ${won ? SUCCESS : FAIL}`);

        return won;
    }

    private checkMove(move: string[]): boolean {
        for (let rowIndex = 0; rowIndex < this.options.expectedPlayerOutput.length; rowIndex++) {
            const expectedRow = this.options.expectedPlayerOutput[rowIndex];
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
        if (!this.options.hideEngineLogs) {
            console.log(`${DASHES} ${message} ${DASHES}`);
        }
    }
}
