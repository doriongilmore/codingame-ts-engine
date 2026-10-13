import { InvalidMove } from "./InvalidMove.js";
import { PlayerFailure, type BotPlayer } from "./Player.js";
import { computeRanks } from "./ranking.js";
import type { EliminationKind, GameResult, Plays, Referee, Winner } from "../types.js";

const DASHES = "------";
/** CodinGame gives 1s to the first turn, and around 50-100ms to the others */
const DEFAULT_FIRST_TURN_TIMEOUT_MS = 1000;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export interface BotEngineOptions<State, Play = string[]> {
    referee: Referee<State, Play>,
    players: BotPlayer[],
    seed?: number,
    hideEngineLogs?: boolean,
    /** use Infinity to debug with breakpoints */
    firstTurnTimeoutMs?: number,
    turnTimeoutMs?: number,
}

export default class BotEngine<State, Play = string[]> {
    constructor(public options: BotEngineOptions<State, Play>) {}

    async run(): Promise<GameResult> {
        const { referee, players } = this.options;
        /** false once the engine eliminated the player (timeout, crash, rule violation) */
        const alive: boolean[] = players.map(() => true);
        /** turn at which each player left the game (-1: before the first turn), null while in game */
        const outAt: (number | null)[] = players.map(() => null);
        let clock = -1;
        const eliminated: GameResult["eliminated"] = [];

        const eliminate = (player: number, kind: EliminationKind, reason: string) => {
            alive[player] = false;
            outAt[player] = outAt[player] ?? clock;
            eliminated.push({ player, kind, reason });
            console.warn(`player ${player} eliminated (${kind}): ${reason}`);
        };
        const eliminateOnFailure = (player: number, error: unknown) => {
            const kind = error instanceof PlayerFailure ? error.kind : "crash";
            eliminate(player, kind, errorMessage(error));
        };
        const inGameCount = () => outAt.filter((out) => out === null).length;
        /** with several players, the game is over as soon as at most one is still in the game */
        const survivorsWinner = (): Winner => {
            if (players.length < 2 || inGameCount() > 1) {
                return null;
            }
            return inGameCount() === 1 ? outAt.indexOf(null) : "draw";
        };

        let state = referee.init(players.length, this.options.seed ?? 0);
        /** players taken out of the game by the rules (the referee tells, the engine notes the turn) */
        const markOut = () => {
            players.forEach((_, player) => {
                if (outAt[player] === null && referee.isOut?.(state, player)) {
                    outAt[player] = clock;
                }
            });
        };
        let turn = 0;
        let winner: Winner = null;

        try {
            const starts = await Promise.allSettled(players.map((player) => player.start()));
            starts.forEach((result, index) => {
                if (result.status === "rejected") {
                    eliminateOnFailure(index, result.reason);
                }
            });
            markOut();
            winner = survivorsWinner();

            this.logStep("Game started");
            this.display(state);
            players.forEach((player, index) => {
                if (alive[index]) {
                    player.send(referee.getInitInputs(state, index));
                }
            });

            winner = winner ?? referee.winner(state);
            while (winner === null && turn < referee.maxTurns) {
                clock = turn;
                const active = referee
                    .activePlayers(state, [...alive])
                    .filter((player) => outAt[player] === null);
                if (!active.length) {
                    break;
                }
                this.logStep(`new turn ${turn}`);

                const timeout = turn === 0
                    ? this.options.firstTurnTimeoutMs ?? DEFAULT_FIRST_TURN_TIMEOUT_MS
                    : this.options.turnTimeoutMs ?? DEFAULT_TURN_TIMEOUT_MS;
                const answers = active.map((player) => {
                    players[player].send(referee.getTurnInputs(state, player));
                    return players[player].read(referee.expectedOutputLines(state, player), timeout);
                });
                const settled = await Promise.allSettled(answers);

                // like on CodinGame, whoever breaks the rules loses: check every answer before applying any
                const plays: Plays<Play> = {};
                settled.forEach((result, index) => {
                    const player = active[index];
                    if (result.status === "rejected") {
                        eliminateOnFailure(player, result.reason);
                        return;
                    }
                    try {
                        const play = referee.parsePlay(state, player, result.value);
                        referee.validatePlay(state, player, play);
                        plays[player] = play;
                    } catch (error) {
                        if (!(error instanceof InvalidMove)) {
                            throw error; // bug in the referee, not a rule violation
                        }
                        eliminate(player, "invalid", error.reason);
                    }
                });

                if (Object.keys(plays).length) {
                    state = referee.update(state, plays);
                    this.display(state);
                }
                markOut();

                turn++;
                winner = survivorsWinner() ?? referee.winner(state);
            }

            if (winner === null) {
                // turn limit reached (or nobody left to play) without a winner
                winner = players.length > 1 || eliminated.length === 0 ? "draw" : null;
            }
        } finally {
            await Promise.allSettled(players.map((player) => player.stop()));
        }

        const scores = referee.scores?.(state);
        const ranks = computeRanks(outAt, typeof winner === "number" ? winner : null, scores);
        if (players.length > 1) {
            // the ranking is the reference: one first player is the winner, a tie for first is a draw
            winner = ranks.filter((rank) => rank === 1).length === 1 ? ranks.indexOf(1) : "draw";
        }

        this.logStep(`Game finished. Winner : ${winner}`);
        return { winner, turns: turn, eliminated, ranks };
    }

    private display(state: State): void {
        if (!this.options.hideEngineLogs) {
            this.options.referee.display?.(state);
        }
    }

    private logStep(message: string): void {
        if (!this.options.hideEngineLogs) {
            console.log(`${DASHES} ${message} ${DASHES}`);
        }
    }
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
