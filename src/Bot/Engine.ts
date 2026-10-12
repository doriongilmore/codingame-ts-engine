import { InvalidMove } from "./InvalidMove.js";
import type { BotPlayer } from "./Player.js";
import { PlayerFailure } from "./Player.js";
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
        const alive: boolean[] = players.map(() => true);
        const eliminated: GameResult["eliminated"] = [];
        const eliminate = (player: number, kind: EliminationKind, reason: string) => {
            alive[player] = false;
            eliminated.push({ player, kind, reason });
            console.warn(`player ${player} eliminated (${kind}): ${reason}`);
        };
        const eliminateOnFailure = (player: number, error: unknown) => {
            const kind = error instanceof PlayerFailure ? error.kind : "crash";
            eliminate(player, kind, errorMessage(error));
        };
        const aliveCount = () => alive.filter(Boolean).length;
        /** with several players, the game is over as soon as at most one is left */
        const survivorsWinner = (): Winner => {
            if (players.length < 2 || aliveCount() > 1) {
                return null;
            }
            return aliveCount() === 1 ? alive.indexOf(true) : "draw";
        };

        let state = referee.init(players.length, this.options.seed ?? 0);
        let turn = 0;
        let winner: Winner = null;

        try {
            const starts = await Promise.allSettled(players.map((player) => player.start()));
            starts.forEach((result, index) => {
                if (result.status === "rejected") {
                    eliminateOnFailure(index, result.reason);
                }
            });
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
                const active = referee
                    .activePlayers(state, [...alive])
                    .filter((player) => alive[player]);
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

        this.logStep(`Game finished. Winner : ${winner}`);
        return { winner, turns: turn, eliminated };
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
