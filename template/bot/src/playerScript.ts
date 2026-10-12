/**
 * Auto-generated code below aims at helping you use
 * codingame-ts-engine. You can see the Auto-generated code
 * from codingame in `main` function.
 *
 * The beginning of this file until `export default API;` (included)
 * must be removed before copy-pasting to CodinGame
 * You should also remember to uncomment the last line `main(readline);`
 **/
import type { BotScript } from "@doriongilmore/codingame-ts-engine/types";

const API: BotScript = { main };
export default API;
// everything until this line must be removed in CodinGame

type ReadlineFunction = () => string

type Cell = { row: number; col: number }

const WIDTH = 3;
const BLANK = ".";
const ME = "X";
const HIM = "O";

/** true if playing `cell` makes `owner` complete a line (row, column or diagonal) */
function completesLine(board: string[][], cell: Cell, owner: string): boolean {
    const lines: Cell[][] = [
        Array.from({ length: WIDTH }, (_, col) => ({ row: cell.row, col })),
        Array.from({ length: WIDTH }, (_, row) => ({ row, col: cell.col })),
    ];
    if (cell.row === cell.col) {
        lines.push(Array.from({ length: WIDTH }, (_, i) => ({ row: i, col: i })));
    }
    if (cell.row + cell.col === WIDTH - 1) {
        lines.push(Array.from({ length: WIDTH }, (_, i) => ({ row: i, col: WIDTH - 1 - i })));
    }
    return lines.some((line) => {
        return line
            .filter((other) => other.row !== cell.row || other.col !== cell.col)
            .every((other) => board[other.row][other.col] === owner);
    });
}

function score(board: string[][], cell: Cell): number {
    if (completesLine(board, cell, ME)) return 100; // win
    if (completesLine(board, cell, HIM)) return 50; // block
    if (cell.row === 1 && cell.col === 1) return 10; // center
    if (cell.row % 2 === 0 && cell.col % 2 === 0) return 5; // corner
    return 1;
}

function main(readline: ReadlineFunction): void {
    const board: string[][] = Array.from({ length: WIDTH }, () => Array(WIDTH).fill(BLANK));

    // game loop
    while (true) {
        const [opponentRow, opponentCol] = readline().split(' ').map(Number);
        if (opponentRow >= 0) {
            board[opponentRow][opponentCol] = HIM;
        }

        const validActionCount: number = parseInt(readline());
        const moves: Cell[] = [];
        for (let i = 0; i < validActionCount; i++) {
            const [row, col] = readline().split(' ').map(Number);
            moves.push({ row, col });
        }

        const best = moves.reduce((a, b) => (score(board, b) > score(board, a) ? b : a));
        board[best.row][best.col] = ME;

        // To debug: console.error('Debug messages...');
        console.log(`${best.row} ${best.col}`);
    }
}

// main(readline);
