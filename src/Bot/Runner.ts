import { resolve } from "path";
import BotEngine from "./Engine.js";
import { ProcessPlayer } from "./ProcessPlayer.js";
import type { EliminationKind, GameResult, Referee } from "../types.js";

export interface RunOptions<State, Play = string[]> {
    referee: Referee<State, Play>,
    /** paths of the bot scripts, one per player (the same script can be given several times) */
    players: string[],
    seed?: number,
    hideEngineLogs?: boolean,
    /** print what bots write with console.error (default: true) */
    showPlayerLogs?: boolean,
    firstTurnTimeoutMs?: number,
    turnTimeoutMs?: number,
}

export interface EvaluateOptions<State, Play = string[]> extends RunOptions<State, Play> {
    /** number of games to play (default: 20) */
    games?: number,
    /** alternate who plays first, as the first player is usually advantaged (default: true) */
    swapSides?: boolean,
}

export interface CompeteOptions<State, Play = string[]> extends RunOptions<State, Play> {
    /** number of games to play, a multiple of the player count plays every seat the same number of times (default: 20) */
    games?: number,
    /** rotate the seats of the scripts from one game to the next (default: true) */
    rotateSeats?: boolean,
}

/** a rule violation, a timeout or a crash: `script` is the index in `players` */
export interface ScriptError {
    game: number,
    script: number,
    kind: EliminationKind,
    reason: string,
}

export interface EvaluationResult {
    games: number,
    /** all counts are from the point of view of `players[0]` (the script you are working on) */
    wins: number,
    losses: number,
    draws: number,
    /** wins / games, between 0 and 1 */
    rate: number,
    /** every rule violation, timeout or crash: `script` is 0 for the evaluated script, 1 for the opponent */
    errors: (ScriptError & { script: 0 | 1 })[],
    /** `winner`, `eliminated` and `ranks` are given for the scripts (0: evaluated one), not for the seats */
    results: GameResult[],
}

export interface ScriptStats {
    script: string,
    games: number,
    /** games where the script was alone in first place */
    wins: number,
    /** average rank, 1 is the best */
    avgRank: number,
    /** rankCounts[0] is the number of games ranked 1st, [1] ranked 2nd... (ties share a rank) */
    rankCounts: number[],
    /** sum over games of (player count - rank): ties share the points of the best rank */
    points: number,
    /** times the script was eliminated (rule violation, timeout, crash) */
    errors: number,
}

export interface CompeteResult {
    games: number,
    /** same order as `players` */
    scripts: ScriptStats[],
    errors: ScriptError[],
    /** `winner`, `eliminated` and `ranks` are given for the scripts (index in `players`), not for the seats */
    results: GameResult[],
}

export async function run<State, Play = string[]>(options: RunOptions<State, Play>): Promise<GameResult> {
    const players = options.players.map((script, index) => {
        return new ProcessPlayer(resolve(script), index, {
            forwardStderr: options.showPlayerLogs ?? true,
        });
    });
    const engine = new BotEngine({
        referee: options.referee,
        players,
        seed: options.seed,
        hideEngineLogs: options.hideEngineLogs,
        firstTurnTimeoutMs: options.firstTurnTimeoutMs,
        turnTimeoutMs: options.turnTimeoutMs,
    });
    return engine.run();
}

/**
 * Plays `games` games with the same scripts, rotating their seats. In game `g` the script `k` sits
 * in seat `(k - shift) mod n`. All the games of a rotation round use the same seed, so every script
 * plays the same map from every seat.
 */
async function playSeries<State, Play>(
    options: RunOptions<State, Play>,
    games: number,
    rotateSeats: boolean,
): Promise<{ results: GameResult[], errors: ScriptError[] }> {
    const count = options.players.length;
    if (count < 2) {
        throw new Error("at least 2 players are needed to compare scripts");
    }
    const baseSeed = options.seed ?? 1;
    const results: GameResult[] = [];
    const errors: ScriptError[] = [];

    for (let game = 0; game < games; game++) {
        const shift = rotateSeats ? game % count : 0;
        const round = rotateSeats ? Math.floor(game / count) : game;
        // seat `s` plays the script `(s + shift) mod count`
        const seats = options.players.map((_, seat) => options.players[(seat + shift) % count]);
        const scriptOfSeat = (seat: number) => (seat + shift) % count;

        const result = await run({
            ...options,
            players: seats,
            seed: baseSeed + round,
            hideEngineLogs: options.hideEngineLogs ?? true,
            showPlayerLogs: options.showPlayerLogs ?? false,
        });

        const ranks = options.players.map((_, script) => result.ranks[(script - shift + count) % count]);
        const winner = typeof result.winner === "number" ? scriptOfSeat(result.winner) : result.winner;
        const eliminated = result.eliminated.map((entry) => ({ ...entry, player: scriptOfSeat(entry.player) }));
        results.push({ ...result, winner, eliminated, ranks });
        for (const { player, kind, reason } of eliminated) {
            errors.push({ game, script: player, kind, reason });
        }
    }

    return { results, errors };
}

/** Play several games between two scripts and tell how often the first one wins */
export async function evaluate<State, Play = string[]>(options: EvaluateOptions<State, Play>): Promise<EvaluationResult> {
    if (options.players.length !== 2) {
        throw new Error("evaluate needs exactly 2 players: [script to evaluate, opponent]");
    }
    const games = options.games ?? 20;
    const { results, errors } = await playSeries(options, games, options.swapSides ?? true);

    const wins = results.filter((result) => result.winner === 0).length;
    const losses = results.filter((result) => result.winner === 1).length;
    const draws = games - wins - losses;
    return {
        games,
        wins,
        losses,
        draws,
        rate: games ? wins / games : 0,
        errors: errors as EvaluationResult["errors"],
        results,
    };
}

/**
 * Play several games with 2 or more scripts at the same time (the referee must support that many
 * players) and rank the scripts: average rank, rank distribution, wins, points.
 */
export async function compete<State, Play = string[]>(options: CompeteOptions<State, Play>): Promise<CompeteResult> {
    const games = options.games ?? 20;
    const count = options.players.length;
    const { results, errors } = await playSeries(options, games, options.rotateSeats ?? true);

    const scripts: ScriptStats[] = options.players.map((script, index) => {
        const ranks = results.map((result) => result.ranks[index]);
        const rankCounts = Array<number>(count).fill(0);
        ranks.forEach((rank) => rankCounts[rank - 1]++);
        return {
            script,
            games,
            wins: results.filter((result) => result.winner === index).length,
            avgRank: games ? ranks.reduce((sum, rank) => sum + rank, 0) / games : 0,
            rankCounts,
            points: ranks.reduce((sum, rank) => sum + (count - rank), 0),
            errors: errors.filter((error) => error.script === index).length,
        };
    });

    return { games, scripts, errors, results };
}
