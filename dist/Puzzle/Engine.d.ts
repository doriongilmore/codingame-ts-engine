import type { PuzzleScript } from "../types.js";
export default class PuzzleEngine {
    playerInputs: string[];
    expectedPlayerOutput: string[];
    script: PuzzleScript;
    constructor(playerInputs: string[], expectedPlayerOutput: string[], script: PuzzleScript);
    run(): void;
    private checkMove;
    private warnFailure;
    private logStep;
}
//# sourceMappingURL=Engine.d.ts.map