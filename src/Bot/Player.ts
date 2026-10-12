/** Something went wrong with a player: it will be eliminated by the engine */
export class PlayerFailure extends Error {
    constructor(public kind: "timeout" | "crash" | "start", message: string) {
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
    /** resolves with exactly `count` lines, rejects with a PlayerFailure */
    read(count: number, timeoutMs: number): Promise<string[]>;
    stop(): Promise<void>;
}
