import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { evaluate, run } from "../src/Bot/Runner.js";
import type { Referee } from "../src/types.js";
import type { State } from "../template/bot/game/Referee.js";

// template/bot/package.json may exist (copied by `npm run dev:bot`), it makes the file CJS: handle both
const loaded: any = await import("../template/bot/game/Referee.js");
const referee: Referee<State> = loaded.referee ?? loaded.default.referee;

function template(path: string): string {
    return fileURLToPath(new URL(`../template/bot/${path}`, import.meta.url));
}

const common = { referee, hideEngineLogs: true, showPlayerLogs: false, firstTurnTimeoutMs: 10_000, turnTimeoutMs: 1000 };

describe("template/bot", () => {
    it("source script plays only legal moves against the opponent", async () => {
        const result = await evaluate({
            ...common,
            players: [template("src/playerScript.ts"), template("src/opponentScript.ts")],
            games: 4,
        });
        assert.equal(result.games, 4);
        assert.ok(result.results.every((game) => game.eliminated.length === 0));
        assert.ok(result.wins >= 1);
    });

    it("script built for CodinGame behaves like the source one", async () => {
        const result = await run({
            ...common,
            players: [template("codingame/playerScript.ts"), template("src/opponentScript.ts")],
        });
        assert.deepEqual(result.eliminated, []);
        assert.notEqual(result.winner, null);
    });

    it("blocks and wins: player never loses to itself by an illegal move", async () => {
        const script = template("src/playerScript.ts");
        const result = await run({ ...common, players: [script, script] });
        assert.deepEqual(result.eliminated, []);
        assert.equal(result.winner, "draw");
    });
});
