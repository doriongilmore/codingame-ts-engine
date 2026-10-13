import { InvalidMove } from "../src/Bot/InvalidMove.js";
import type { Plays, Referee, Winner } from "../src/types.js";

/** Parse "<integer>" and nothing else, like a CodinGame referee would */
function parseInteger(lines: string[]): number {
    if (!/^\d+$/.test(lines[0])) {
        throw new InvalidMove(`expected an integer but got "${lines[0]}"`);
    }
    return Number(lines[0]);
}

/** Sequential: players alternately add 1 to 3 to a sum, who reaches 10 first wins */
export interface CountState { sum: number, current: number, winner: Winner }

export const countReferee: Referee<CountState, number> = {
    maxTurns: 20,
    init: () => ({ sum: 0, current: 0, winner: null }),
    getInitInputs: () => [],
    getTurnInputs: (state) => [String(state.sum)],
    activePlayers: (state, alive) => {
        // skip dead players, there are only 2 here
        return alive[state.current] ? [state.current] : [1 - state.current];
    },
    expectedOutputLines: () => 1,
    parsePlay: (_state, _player, lines) => parseInteger(lines),
    validatePlay(_state, _player, play) {
        if (![1, 2, 3].includes(play)) {
            throw new InvalidMove(`expected 1, 2 or 3 but got ${play}`);
        }
    },
    update(state, plays: Plays<number>) {
        const player = state.current;
        if (plays[player] === undefined) {
            return { ...state, current: 1 - player }; // eliminated player: nothing to apply
        }
        const sum = state.sum + plays[player];
        return { sum, current: 1 - player, winner: sum >= 10 ? player : null };
    },
    winner: (state) => state.winner,
};

/** Simultaneous: everybody writes a number each turn, highest total after 3 turns wins */
export interface ScoreState { turn: number, scores: number[] }

export const scoreReferee: Referee<ScoreState, number> = {
    maxTurns: 3,
    init: (playerCount) => ({ turn: 0, scores: Array(playerCount).fill(0) }),
    getInitInputs: () => [],
    getTurnInputs: (state) => [String(state.turn)],
    activePlayers: (state, alive) => alive.map((_, index) => index).filter((index) => alive[index]),
    expectedOutputLines: () => 1,
    parsePlay: (_state, _player, lines) => parseInteger(lines),
    validatePlay(_state, _player, play) {
        if (play > 5) {
            throw new InvalidMove(`expected an integer from 0 to 5 but got ${play}`);
        }
    },
    update(state, plays) {
        const scores = [...state.scores];
        for (const [player, value] of Object.entries(plays)) {
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
    scores: (state) => state.scores,
};

/**
 * Simultaneous, N players: answering 0 (or not answering) means death. A dead player is out of
 * the game. Last one in the game wins, nobody wins before turn 5.
 */
export interface SurvivalState { turn: number, dead: boolean[] }

export const survivalReferee: Referee<SurvivalState, number> = {
    maxTurns: 5,
    init: (playerCount) => ({ turn: 0, dead: Array(playerCount).fill(false) }),
    getInitInputs: () => [],
    getTurnInputs: (state) => [String(state.turn)],
    activePlayers: (state, alive) => alive.map((_, i) => i).filter((i) => alive[i] && !state.dead[i]),
    expectedOutputLines: () => 1,
    parsePlay: (_state, _player, lines) => parseInteger(lines),
    validatePlay() {},
    update(state, plays) {
        const dead = state.dead.map((isDead, player) => isDead || !plays[player]);
        return { turn: state.turn + 1, dead };
    },
    winner(state) {
        const inGame = state.dead.filter((isDead) => !isDead).length;
        if (inGame > 1) return null;
        return inGame === 1 ? state.dead.indexOf(false) : "draw";
    },
    isOut: (state, player) => state.dead[player],
};

/** Turn limit after 2 turns, no winner by the rules: the scores tell who is first */
export const limitReferee: Referee<ScoreState, number> = {
    ...scoreReferee,
    maxTurns: 2,
    winner: () => null,
};
