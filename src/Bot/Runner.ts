import { resolve } from "path";
import BotEngine from "./Engine.js";
import { ProcessPlayer } from "./ProcessPlayer.js";
import type { GameResult, Referee } from "../types.js";

export interface RunOptions<State> {
    referee: Referee<State>,
    /** paths of the bot scripts, one per player (the same script can be given several times) */
    players: string[],
    seed?: number,
    hideEngineLogs?: boolean,
    /** print what bots write with console.error (default: true) */
    showPlayerLogs?: boolean,
    firstTurnTimeoutMs?: number,
    turnTimeoutMs?: number,
}

export interface EvaluateOptions<State> extends RunOptions<State> {
    /** number of games to play (default: 20) */
    games?: number,
    /** alternate who plays first, as the first player is usually advantaged (default: true) */
    swapSides?: boolean,
}

export interface EvaluationResult {
    games: number,
    /** all counts are from the point of view of `players[0]` (the script you are working on) */
    wins: number,
    losses: number,
    draws: number,
    /** wins / games, between 0 and 1 */
    rate: number,
    results: GameResult[],
}

export async function run<State>(options: RunOptions<State>): Promise<GameResult> {
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

/** Play several games between two scripts and tell how often the first one wins */
export async function evaluate<State>(options: EvaluateOptions<State>): Promise<EvaluationResult> {
    if (options.players.length !== 2) {
        throw new Error("evaluate needs exactly 2 players: [script to evaluate, opponent]");
    }
    const games = options.games ?? 20;
    const swapSides = options.swapSides ?? true;
    const baseSeed = options.seed ?? 1;
    const results: GameResult[] = [];
    let wins = 0, losses = 0, draws = 0;

    for (let game = 0; game < games; game++) {
        const swapped = swapSides && game % 2 === 1;
        const players = swapped ? [options.players[1], options.players[0]] : options.players;
        const result = await run({
            ...options,
            players,
            seed: baseSeed + game,
            hideEngineLogs: options.hideEngineLogs ?? true,
            showPlayerLogs: options.showPlayerLogs ?? false,
        });
        // back to the point of view of the evaluated script
        const evaluated = swapped ? 1 : 0;
        const winner = result.winner === "draw" || result.winner === null
            ? result.winner
            : result.winner === evaluated ? 0 : 1;
        results.push({ ...result, winner });
        if (winner === 0) wins++;
        else if (winner === 1) losses++;
        else draws++;
    }

    return { games, wins, losses, draws, rate: games ? wins / games : 0, results };
}
