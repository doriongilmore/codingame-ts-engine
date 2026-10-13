export type ReadlineFunction = () => string

export type PuzzleExerciseData = {
    inputs: string[];
    outputs: string[];
}

export interface PuzzleScript {
    main: (readline: ReadlineFunction) => string[],
}

/**
 * Bot script: same shape as on CodinGame, the game loop (`while (true)`) lives in `main`
 * and answers are written with `console.log`.
 */
export interface BotScript {
    main: (readline: ReadlineFunction) => void,
}

/** a player index, or "draw", or null when the game has no winner (yet) */
export type Winner = number | "draw" | null;

/** valid plays of the players who answered this turn, indexed by player */
export type Plays<Play> = Record<number, Play>;

/** why a player was removed from the game */
export type EliminationKind =
    | "start"   // the script could not be started
    | "timeout" // no complete answer in time
    | "crash"   // the process exited or threw
    | "output"  // wrong number of output lines (missing or extra)
    | "invalid"; // the referee refused the answer (malformed or against the rules)

/**
 * Rules of a bot game, modelled after CodinGame referees.
 * - sequential game: `activePlayers` returns a single player
 * - simultaneous game: `activePlayers` returns several players, `update` gets all plays at once
 *
 * Like on CodinGame, a player who does not respect the rules loses: the engine checks
 * the number of lines, then calls `parsePlay` and `validatePlay`, and eliminates the player
 * as soon as one of them throws an `InvalidMove`. `update` only ever receives valid plays.
 */
export interface Referee<State, Play = string[]> {
    /** maximum number of engine turns (one engine turn = one call to `update`) */
    maxTurns: number;
    /** build the initial state. `seed` makes games reproducible */
    init(playerCount: number, seed: number): State;
    /** lines given to the player once, before the first turn */
    getInitInputs(state: State, player: number): string[];
    /** lines given to the player at the beginning of its turn */
    getTurnInputs(state: State, player: number): string[];
    /** players who must answer this turn. `alive[i]` is false for eliminated players */
    activePlayers(state: State, alive: boolean[]): number[];
    /** exact number of lines the player has to write this turn (more or less is a loss) */
    expectedOutputLines(state: State, player: number): number;
    /**
     * Turn the lines written by the player into a Play (syntax: expected tokens, numbers...).
     * Throw `InvalidMove` if the output is malformed.
     */
    parsePlay(state: State, player: number, lines: string[]): Play;
    /**
     * Check the Play against the rules in the current state (value out of range, forbidden action...).
     * Throw `InvalidMove` if it is not allowed.
     */
    validatePlay(state: State, player: number, play: Play): void;
    /** Advance the state with the valid plays. Players who lost this turn are missing from `plays` */
    update(state: State, plays: Plays<Play>): State;
    /** null while the game goes on */
    winner(state: State): Winner;
    /**
     * True when the rules took the player out of the game (dead, bankrupt...). Optional: players
     * eliminated by the engine (timeout, crash, rule violation) are tracked by the engine itself.
     * Without it, the engine cannot tell that a player is out, nor when.
     */
    isOut?(state: State, player: number): boolean;
    /**
     * Optional scores (higher is better, indexed by player) used to tell apart the players still
     * in the game at the end, for example when the turn limit is reached.
     */
    scores?(state: State): number[];
    /** optional readable log of the state */
    display?(state: State): void;
}

export interface GameResult {
    winner: Winner;
    /** number of engine turns played */
    turns: number;
    /** players removed from the game, with the reason */
    eliminated: { player: number; kind: EliminationKind; reason: string }[];
    /**
     * Rank of each player, indexed by player: 1 is the best, ties share a rank (1, 2, 2, 4).
     * Whoever stays in the game the longest ranks first; players leaving at the same turn tie,
     * whatever the cause (rule violation, crash or death).
     */
    ranks: number[];
}
