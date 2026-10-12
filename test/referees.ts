import { InvalidMove } from "../src/Bot/InvalidMove.js";
import type { PlayerOutputs, Referee, Winner } from "../src/types.js";

/** Sequential: players alternately add 1 to 3 to a sum, who reaches 10 first wins */
export interface CountState { sum: number, current: number, winner: Winner }

export const countReferee: Referee<CountState> = {
    maxTurns: 20,
    init: () => ({ sum: 0, current: 0, winner: null }),
    getInitInputs: () => [],
    getTurnInputs: (state) => [String(state.sum)],
    activePlayers: (state, alive) => {
        // skip dead players, there are only 2 here
        return alive[state.current] ? [state.current] : [1 - state.current];
    },
    expectedOutputLines: () => 1,
    update(state, outputs: PlayerOutputs) {
        const player = state.current;
        const value = Number(outputs[player]?.[0]);
        if (![1, 2, 3].includes(value)) {
            throw new InvalidMove(player, `expected 1, 2 or 3 but got "${outputs[player]?.[0]}"`);
        }
        const sum = state.sum + value;
        return { sum, current: 1 - player, winner: sum >= 10 ? player : null };
    },
    winner: (state) => state.winner,
};

/** Simultaneous: everybody writes a number each turn, highest total after 3 turns wins */
export interface ScoreState { turn: number, scores: number[] }

export const scoreReferee: Referee<ScoreState> = {
    maxTurns: 3,
    init: (playerCount) => ({ turn: 0, scores: Array(playerCount).fill(0) }),
    getInitInputs: () => [],
    getTurnInputs: (state) => [String(state.turn)],
    activePlayers: (state, alive) => alive.map((_, index) => index).filter((index) => alive[index]),
    expectedOutputLines: () => 1,
    update(state, outputs) {
        const scores = [...state.scores];
        for (const [player, lines] of Object.entries(outputs)) {
            const value = Number(lines[0]);
            if (!Number.isInteger(value) || value < 0 || value > 5) {
                throw new InvalidMove(Number(player), `expected an integer from 0 to 5`);
            }
            scores[Number(player)] += value;
        }
        return { turn: state.turn + 1, scores };
    },
    winner(state) {
        if (state.turn < 3) {
            return null;
        }
        const best = Math.max(...state.scores);
        const bests = state.scores.filter((score) => score === best).length;
        return bests > 1 ? "draw" : state.scores.indexOf(best);
    },
};
