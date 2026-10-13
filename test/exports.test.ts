import assert from "node:assert/strict";
import { describe, it } from "node:test";

// self reference by package name: goes through `exports`, as a project depending on the package does
describe("package exports", () => {
    it("exposes createRandom for referees", async () => {
        const { createRandom } = await import("@doriongilmore/codingame-ts-engine/lib/createRandom");
        assert.equal(typeof createRandom(1)(), "number");
    });

    it("exposes bot modules", async () => {
        const { InvalidMove } = await import("@doriongilmore/codingame-ts-engine/bot/InvalidMove");
        assert.equal(new InvalidMove("x").reason, "x");
    });
});
