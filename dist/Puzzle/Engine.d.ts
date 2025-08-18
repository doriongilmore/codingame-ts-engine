import type { PuzzleScript } from "../types.js";
export interface PuzzleEngineOptions {
    playerInputs: string[];
    expectedPlayerOutput: string[];
    script: PuzzleScript;
    hideEngineLogs?: boolean;
}
export default class PuzzleEngine {
    options: PuzzleEngineOptions;
    constructor(options: PuzzleEngineOptions);
    run(): boolean;
    private checkMove;
    private warnFailure;
    private logStep;
}
//# sourceMappingURL=Engine.d.ts.map