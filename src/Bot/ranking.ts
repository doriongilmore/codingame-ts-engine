/**
 * Ranks of the players at the end of a game, like CodinGame does: whoever stays in the game the
 * longest is ranked first. Players leaving at the same turn share their rank (1, 2, 2, 4).
 *
 * @param outAt for each player, the turn at which it left the game (-1: before the first turn),
 *              or null if it was still in the game at the end
 * @param winner the winner given by the referee, ranked above the other players still in the game
 * @param scores optional scores (higher is better) to tell apart the players still in the game
 * @returns ranks[player], 1 is the best
 */
export function computeRanks(
    outAt: (number | null)[],
    winner: number | null = null,
    scores?: number[],
): number[] {
    /** compares two players: > 0 when `a` is ranked above `b` */
    function compare(a: number, b: number): number {
        const outA = outAt[a];
        const outB = outAt[b];
        if (outA !== null || outB !== null) {
            if (outA === null) return 1;
            if (outB === null) return -1;
            return outA - outB; // left later: better
        }
        // both are still in the game
        if ((winner === a) !== (winner === b)) {
            return winner === a ? 1 : -1;
        }
        return (scores?.[a] ?? 0) - (scores?.[b] ?? 0);
    }

    return outAt.map((_, player) => {
        let better = 0;
        for (let other = 0; other < outAt.length; other++) {
            if (other !== player && compare(other, player) > 0) {
                better++;
            }
        }
        return 1 + better;
    });
}
