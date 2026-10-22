import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

function build(template: string): string {
    const out = mkdtempSync(join(tmpdir(), "cg-build-"));
    try {
        const script = join(root, "template", template, "src", "playerScript.ts");
        const { status, stderr } = spawnSync(
            process.execPath,
            ["--import", "tsx", join(root, "bin", "buildForCodingame.ts"), `--script=${script}`, `--out=${out}`],
            { cwd: root, encoding: "utf-8" },
        );
        assert.equal(status, 0, stderr);
        return readFileSync(join(out, "playerScript.ts"), "utf-8");
    } finally {
        rmSync(out, { recursive: true });
    }
}

describe("buildForCodingame", () => {
    it("marks inlined files with a path relative to the entry script, never an absolute one", () => {
        for (const template of ["puzzle", "puzzle.multifile", "bot"]) {
            const markers = build(template).split("\n").filter((line) => line.startsWith("// file:"));
            assert.ok(markers.length > 0, template);
            for (const marker of markers) {
                const path = marker.slice("// file:".length);
                assert.ok(!path.startsWith("/") && !/^[a-z]:/i.test(path), `absolute path in ${template}: ${marker}`);
                assert.ok(!path.includes(root), `local path leaked in ${template}: ${marker}`);
            }
        }
    });

    it("lists every inlined file of a multifile project", () => {
        const markers = build("puzzle.multifile").split("\n").filter((line) => line.startsWith("// file:"));
        assert.ok(markers.includes("// file:playerScript.ts"));
        assert.ok(markers.length > 1);
    });
});
