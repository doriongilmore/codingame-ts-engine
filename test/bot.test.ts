import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { createRandom } from "../src/lib/createRandom.js";
import { evaluate, run } from "../src/Bot/Runner.js";
import { countReferee, scoreReferee } from "./referees.js";

function fixture(name: string): string {
    return fileURLToPath(new URL(`./fixtures/${name}.ts`, import.meta.url));
}

const constant = fixture("constantBot");
const silent = fixture("silentBot");
const crash = fixture("crashBot");
const chatty = fixture("chattyBot");
const hang = fixture("hangBot");
const built = fixture("builtBot");

// the first turn includes the loading of the script through tsx
const common = { hideEngineLogs: true, showPlayerLogs: false, firstTurnTimeoutMs: 10_000, turnTimeoutMs: 1000 };

function withValue(value: string, fn: () => Promise<void>): () => Promise<void> {
    return async () => {
        const previous = process.env.BOT_VALUE;
        process.env.BOT_VALUE = value;
        try {
            await fn();
        } finally {
            previous === undefined ? delete process.env.BOT_VALUE : (process.env.BOT_VALUE = previous);
        }
    };
}

describe("bot engine", () => {
    it("plays a sequential game until somebody wins", withValue("3", async () => {
        const result = await run({ ...common, referee: countReferee, players: [constant, constant] });
        // both answer 3: sums are p0 3, p1 6, p0 9, p1 12 => player 1 wins
        assert.equal(result.winner, 1);
        assert.equal(result.turns, 4);
        assert.deepEqual(result.eliminated, []);
    }));

    it("accepts a built script that uses the global readline", async () => {
        const result = await run({ ...common, referee: countReferee, players: [built, built] });
        assert.equal(result.winner, 1);
    });

    it("plays a simultaneous game", withValue("2", async () => {
        const result = await run({ ...common, referee: scoreReferee, players: [constant, built] });
        // built always answers 3, constant answers 2
        assert.equal(result.winner, 1);
        assert.equal(result.turns, 3);
    }));
});

describe("a player breaking the rules loses", () => {
    it("value out of the rules (validatePlay)", withValue("9", async () => {
        const result = await run({ ...common, referee: countReferee, players: [constant, built] });
        assert.equal(result.winner, 1);
        assert.equal(result.eliminated.length, 1);
        assert.equal(result.eliminated[0].player, 0);
        assert.equal(result.eliminated[0].kind, "invalid");
        assert.match(result.eliminated[0].reason, /expected 1, 2 or 3 but got 9/);
    }));

    it("malformed output (parsePlay)", withValue("abc", async () => {
        const result = await run({ ...common, referee: countReferee, players: [built, constant] });
        // built plays first, constant answers "abc" on its turn
        assert.equal(result.winner, 0);
        assert.equal(result.eliminated[0].kind, "invalid");
        assert.match(result.eliminated[0].reason, /expected an integer but got "abc"/);
    }));

    it("extra output line", async () => {
        const result = await run({ ...common, referee: countReferee, players: [chatty, built] });
        assert.equal(result.winner, 1);
        assert.equal(result.eliminated[0].player, 0);
        assert.equal(result.eliminated[0].kind, "output");
        assert.match(result.eliminated[0].reason, /expected 1 output line\(s\) but got 2 \(extra\)/);
    });

    it("missing output line", async () => {
        const result = await run({ ...common, referee: countReferee, players: [silent, built] });
        assert.equal(result.winner, 1);
        assert.equal(result.eliminated[0].kind, "output");
        assert.match(result.eliminated[0].reason, /expected 1 output line\(s\) but got 0 \(missing\)/);
    });

    it("too slow", async () => {
        const result = await run({
            ...common, turnTimeoutMs: 300, firstTurnTimeoutMs: 3000,
            referee: countReferee, players: [hang, built],
        });
        assert.equal(result.winner, 1);
        assert.equal(result.eliminated[0].kind, "timeout");
        assert.match(result.eliminated[0].reason, /no answer within/);
    });

    it("crash", async () => {
        const result = await run({ ...common, referee: countReferee, players: [built, crash] });
        // player 0 plays first, then player 1 crashes
        assert.equal(result.winner, 0);
        assert.equal(result.eliminated[0].player, 1);
        assert.equal(result.eliminated[0].kind, "crash");
        assert.match(result.eliminated[0].reason, /exited/);
    });

    it("keeps playing a simultaneous game without the player who cheated", withValue("9", async () => {
        const result = await run({ ...common, referee: scoreReferee, players: [constant, built] });
        assert.equal(result.winner, 1);
        assert.equal(result.eliminated[0].player, 0);
        assert.equal(result.eliminated[0].kind, "invalid");
    }));

    it("does not apply any play of the turn when everybody was eliminated", withValue("abc", async () => {
        const result = await run({ ...common, referee: scoreReferee, players: [constant, constant] });
        assert.equal(result.winner, "draw");
        assert.equal(result.eliminated.length, 2);
        assert.equal(result.turns, 1);
    }));
});

describe("evaluate", () => {
    it("reports results from the point of view of the first script, whoever starts", async () => {
        const result = await evaluate({
            ...common, referee: scoreReferee, players: [built, constant], games: 4,
        });
        // constant answers "1" by default, built answers 3: built always wins
        assert.equal(result.games, 4);
        assert.equal(result.wins, 4);
        assert.equal(result.rate, 1);
        assert.deepEqual(result.results.map((r) => r.winner), [0, 0, 0, 0]);
        assert.deepEqual(result.errors, []);
    });

    it("counts a losing script as a loss", async () => {
        const result = await evaluate({
            ...common, referee: scoreReferee, players: [constant, built], games: 2,
        });
        assert.equal(result.losses, 2);
        assert.equal(result.rate, 0);
    });

    it("tells which script broke the rules, whatever the side it played", withValue("9", async () => {
        const result = await evaluate({
            ...common, referee: countReferee, players: [constant, built], games: 4,
        });
        // constant answers 9: always invalid, built wins by forfeit
        assert.equal(result.losses, 4);
        assert.equal(result.errors.length, 4);
        assert.ok(result.errors.every((error) => error.script === 0 && error.kind === "invalid"));
        assert.ok(result.results.every((game) => game.eliminated[0].player === 0));
    }));
});

describe("createRandom", () => {
    it("is reproducible and in [0, 1)", () => {
        const a = createRandom(42);
        const b = createRandom(42);
        for (let i = 0; i < 100; i++) {
            const value = a();
            assert.equal(value, b());
            assert.ok(value >= 0 && value < 1);
        }
        assert.notEqual(createRandom(1)(), createRandom(2)());
    });
});
