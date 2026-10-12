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

/** lines written by each player for the current turn, indexed by player */
export type PlayerOutputs = Record<number, string[]>;

/**
 * Rules of a bot game, modelled after CodinGame referees.
 * - sequential game: `activePlayers` returns a single player
 * - simultaneous game: `activePlayers` returns several players, `update` gets all outputs at once
 */
export interface Referee<State> {
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
    /** how many lines the player has to write this turn */
    expectedOutputLines(state: State, player: number): number;
    /**
     * Advance the state. Throw `InvalidMove` to eliminate a player.
     * `outputs` only contains players who answered in time: be tolerant to missing ones.
     */
    update(state: State, outputs: PlayerOutputs): State;
    /** null while the game goes on */
    winner(state: State): Winner;
    /** optional readable log of the state */
    display?(state: State): void;
}

export interface GameResult {
    winner: Winner;
    /** number of engine turns played */
    turns: number;
    /** players removed from the game, with the reason */
    eliminated: { player: number; reason: string }[];
}
