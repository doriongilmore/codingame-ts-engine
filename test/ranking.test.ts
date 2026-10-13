import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { computeRanks } from "../src/Bot/ranking.js";
import { compete, run } from "../src/Bot/Runner.js";
import { limitReferee, scoreReferee, survivalReferee } from "./referees.js";

function fixture(name: string): string {
    return fileURLToPath(new URL(`./fixtures/${name}.ts`, import.meta.url));
}

const zero = fixture("zeroBot");
const one = fixture("oneBot");
const crash = fixture("crashBot");
const crashLate = fixture("crashLateBot");
const constant = fixture("constantBot");
const built = fixture("builtBot"); // always answers 3

const common = { hideEngineLogs: true, showPlayerLogs: false, firstTurnTimeoutMs: 10_000, turnTimeoutMs: 1000 };

describe("computeRanks", () => {
    it("ranks players still in the game at the end together", () => {
        assert.deepEqual(computeRanks([null, null]), [1, 1]);
    });

    it("puts the winner of the referee above the other players still in the game", () => {
        assert.deepEqual(computeRanks([null, null, null], 1), [2, 1, 2]);
    });

    it("ranks by order of departure, ties share a rank", () => {
        assert.deepEqual(computeRanks([2, 2, null, 0]), [2, 2, 1, 4]);
        assert.deepEqual(computeRanks([0, 1, null]), [3, 2, 1]);
    });

    it("uses scores to tell apart the players still in the game", () => {
        assert.deepEqual(computeRanks([null, null, null], null, [1, 5, 3]), [3, 1, 2]);
        assert.deepEqual(computeRanks([null, null, null], 0, [1, 5, 3]), [1, 2, 3]);
    });

    it("never ranks a player who left above one still in the game, whatever the scores", () => {
        assert.deepEqual(computeRanks([4, null], null, [100, 0]), [2, 1]);
    });
});

describe("ranking in a game", () => {
    it("ranks a player dead by the rules and a crashed one together (same turn)", async () => {
        const result = await run({ ...common, referee: survivalReferee, players: [zero, built, crash] });
        // zero dies by the rules and crash crashes, both on turn 0: built is alone in the game
        assert.equal(result.winner, 1);
        assert.deepEqual(result.ranks, [2, 1, 2]);
        assert.equal(result.eliminated.length, 1);
        assert.equal(result.eliminated[0].player, 2);
    });

    it("does not make a player who died first win when the others crash later", async () => {
        // player 0 dies by the rules on turn 0, players 1 and 2 crash on turn 1
        const result = await run({ ...common, referee: survivalReferee, players: [zero, crashLate, crashLate] });
        assert.deepEqual(result.ranks, [3, 1, 1]);
        assert.equal(result.winner, "draw");
    });

    it("ranks by score when the turn limit is reached", async () => {
        const result = await run({ ...common, referee: limitReferee, players: [one, built] });
        assert.equal(result.turns, 2);
        assert.deepEqual(result.ranks, [2, 1]);
        assert.equal(result.winner, 1);
    });

    it("is a draw when nobody can be told apart at the turn limit", async () => {
        const result = await run({ ...common, referee: survivalReferee, players: [one, one] });
        assert.deepEqual(result.ranks, [1, 1]);
        assert.equal(result.winner, "draw");
    });
});

describe("compete", () => {
    it("ranks several scripts at once, whatever the seat they play from", async () => {
        const previous = process.env.BOT_VALUE;
        process.env.BOT_VALUE = "2";
        try {
            // answers 3, 1 and 2: first, last and second in this order
            const result = await compete({
                ...common, referee: scoreReferee, players: [built, one, constant], games: 6,
            });
            assert.equal(result.games, 6);
            const [first, last, second] = result.scripts;
            assert.deepEqual(first.rankCounts, [6, 0, 0]);
            assert.equal(first.avgRank, 1);
            assert.equal(first.wins, 6);
            assert.equal(first.points, 12);
            assert.equal(second.avgRank, 2);
            assert.deepEqual(second.rankCounts, [0, 6, 0]);
            assert.equal(last.avgRank, 3);
            assert.equal(last.points, 0);
            assert.deepEqual(result.errors, []);
        } finally {
            previous === undefined ? delete process.env.BOT_VALUE : (process.env.BOT_VALUE = previous);
        }
    });

    it("reports which script was eliminated, whatever the seat", async () => {
        const result = await compete({
            ...common, referee: survivalReferee, players: [crash, built, one], games: 3,
        });
        // crash is eliminated in every game, whatever its seat
        assert.equal(result.errors.length, 3);
        assert.ok(result.errors.every((error) => error.script === 0));
        assert.equal(result.scripts[0].errors, 3);
        assert.ok(result.scripts[0].avgRank > result.scripts[1].avgRank);
    });

    it("needs at least 2 scripts", async () => {
        await assert.rejects(compete({ ...common, referee: scoreReferee, players: [built] }), /at least 2/);
    });
});
