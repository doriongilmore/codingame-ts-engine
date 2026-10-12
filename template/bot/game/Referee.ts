import { InvalidMove } from "@doriongilmore/codingame-ts-engine/bot/InvalidMove";
import type { Plays, Referee, Winner } from "@doriongilmore/codingame-ts-engine/types";

/**
 * Rules of the game (here a Tic Tac Toe), the equivalent of a CodinGame referee.
 * Replace this file with the rules of your own game.
 * Player 0 plays first. A cell holds the index of the player who played it, or null.
 *
 * Like on CodinGame, a player who breaks the rules loses. The engine already checks the number of
 * output lines, `parsePlay` rejects malformed lines and `validatePlay` rejects forbidden plays.
 */
const WIDTH = 3;

type Cell = number | null;

/** what a player can do: one cell */
export interface Play {
    row: number;
    col: number;
}

export interface State {
    board: Cell[][];
    /** index of the player who must play */
    current: number;
    /** what the opponent just played, sent to the next player */
    lastMove: Play | null;
    winner: Winner;
}

function cloneBoard(board: Cell[][]): Cell[][] {
    return board.map((row) => row.slice());
}

function getFreeCells(board: Cell[][]): Play[] {
    const cells = [];
    for (let row = 0; row < WIDTH; row++) {
        for (let col = 0; col < WIDTH; col++) {
            if (board[row][col] === null) {
                cells.push({ row, col });
            }
        }
    }
    return cells;
}

function hasAlignment(board: Cell[][], player: number): boolean {
    const lines: [number, number][][] = [];
    for (let i = 0; i < WIDTH; i++) {
        lines.push(Array.from({ length: WIDTH }, (_, j) => [i, j] as [number, number])); // row
        lines.push(Array.from({ length: WIDTH }, (_, j) => [j, i] as [number, number])); // column
    }
    lines.push(Array.from({ length: WIDTH }, (_, i) => [i, i] as [number, number]));
    lines.push(Array.from({ length: WIDTH }, (_, i) => [i, WIDTH - 1 - i] as [number, number]));
    return lines.some((line) => line.every(([row, col]) => board[row][col] === player));
}

export const referee: Referee<State, Play> = {
    maxTurns: WIDTH * WIDTH,

    init(): State {
        const board: Cell[][] = Array.from({ length: WIDTH }, () => Array<Cell>(WIDTH).fill(null));
        return { board, current: 0, lastMove: null, winner: null };
    },

    getInitInputs(): string[] {
        return [];
    },

    getTurnInputs(state: State): string[] {
        // opponent last move, valid action count, then every valid action : `${row} ${col}`
        const last = state.lastMove ?? { row: -1, col: -1 };
        const free = getFreeCells(state.board);
        return [
            `${last.row} ${last.col}`,
            String(free.length),
            ...free.map(({ row, col }) => `${row} ${col}`),
        ];
    },

    activePlayers(state: State, alive: boolean[]): number[] {
        return alive[state.current] ? [state.current] : [];
    },

    expectedOutputLines(): number {
        return 1;
    },

    /** syntax: exactly "<row> <col>" with two integers */
    parsePlay(_state: State, _player: number, lines: string[]): Play {
        const match = /^(\d+) (\d+)$/.exec(lines[0]);
        if (!match) {
            throw new InvalidMove(`expected "row col" but got "${lines[0]}"`);
        }
        return { row: Number(match[1]), col: Number(match[2]) };
    },

    /** rules: the cell exists and is free */
    validatePlay(state: State, _player: number, play: Play): void {
        if (play.row >= WIDTH || play.col >= WIDTH) {
            throw new InvalidMove(`cell ${play.row} ${play.col} is outside of the board`);
        }
        if (state.board[play.row][play.col] !== null) {
            throw new InvalidMove(`cell ${play.row} ${play.col} is already taken`);
        }
    },

    update(state: State, plays: Plays<Play>): State {
        const player = state.current;
        const play = plays[player];
        if (!play) {
            return state; // the player was eliminated, nothing to apply
        }

        const board = cloneBoard(state.board);
        board[play.row][play.col] = player;
        let winner: Winner = null;
        if (hasAlignment(board, player)) {
            winner = player;
        } else if (!getFreeCells(board).length) {
            winner = "draw";
        }
        return { board, current: 1 - player, lastMove: play, winner };
    },

    winner(state: State): Winner {
        return state.winner;
    },

    display(state: State): void {
        for (const row of state.board) {
            console.log(row.map((cell) => (cell === null ? "." : String(cell))).join(" "));
        }
    },
};

export default referee;
