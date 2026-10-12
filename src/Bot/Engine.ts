import { InvalidMove } from "./InvalidMove.js";
import type { BotPlayer } from "./Player.js";
import type { GameResult, PlayerOutputs, Referee, Winner } from "../types.js";

const DASHES = "------";
/** CodinGame gives 1s to the first turn, and around 50-100ms to the others */
const DEFAULT_FIRST_TURN_TIMEOUT_MS = 1000;
const DEFAULT_TURN_TIMEOUT_MS = 100;

export interface BotEngineOptions<State> {
    referee: Referee<State>,
    players: BotPlayer[],
    seed?: number,
    hideEngineLogs?: boolean,
    /** use Infinity to debug with breakpoints */
    firstTurnTimeoutMs?: number,
    turnTimeoutMs?: number,
}

export default class BotEngine<State> {
    constructor(public options: BotEngineOptions<State>) {}

    async run(): Promise<GameResult> {
        const { referee, players } = this.options;
        const alive: boolean[] = players.map(() => true);
        const eliminated: GameResult["eliminated"] = [];
        const eliminate = (player: number, reason: string) => {
            alive[player] = false;
            eliminated.push({ player, reason });
            console.warn(`player ${player} eliminated: ${reason}`);
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
                    eliminate(index, errorMessage(result.reason));
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

                const outputs: PlayerOutputs = {};
                settled.forEach((result, index) => {
                    if (result.status === "fulfilled") {
                        outputs[active[index]] = result.value;
                    } else {
                        eliminate(active[index], errorMessage(result.reason));
                    }
                });

                // an invalid move only removes its author: the others are replayed without it
                while (Object.keys(outputs).length) {
                    try {
                        state = referee.update(state, outputs);
                        this.display(state);
                        break;
                    } catch (error) {
                        if (error instanceof InvalidMove && outputs[error.player]) {
                            eliminate(error.player, error.message);
                            delete outputs[error.player];
                        } else {
                            throw error;
                        }
                    }
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
