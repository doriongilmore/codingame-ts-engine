import type { EliminationKind } from "../types.js";

/** Something went wrong with a player: it will be eliminated by the engine */
export class PlayerFailure extends Error {
    constructor(public kind: Exclude<EliminationKind, "invalid">, message: string) {
        super(message);
        this.name = "PlayerFailure";
    }
}

/** A player as seen by the engine: lines in, lines out */
export interface BotPlayer {
    readonly name: string;
    /** resolves when the player is ready to receive inputs */
    start(): Promise<void>;
    send(lines: string[]): void;
    /**
     * Resolves with exactly `count` lines: what the player wrote for this turn.
     * Rejects with a PlayerFailure when it is too slow, crashes, or writes more or less lines.
     */
    read(count: number, timeoutMs: number): Promise<string[]>;
    stop(): Promise<void>;
}
