import { spawn, type ChildProcess } from "child_process";
import { existsSync } from "fs";
import { basename } from "path";
import { createRequire } from "module";
import { fileURLToPath, pathToFileURL } from "url";
import { PlayerFailure, type BotPlayer } from "./Player.js";
import { READY_MARKER } from "./protocol.js";

const STARTUP_TIMEOUT_MS = 10_000;
const MAX_TIMER_MS = 2 ** 31 - 1;

export interface ProcessPlayerOptions {
    /** print what the bot writes on stderr (`console.error`), prefixed with its name */
    forwardStderr?: boolean,
}

/** host.js when running from `dist`, host.ts when running from `src` (through tsx) */
function getHostPath(): string {
    const compiled = fileURLToPath(new URL("./host.js", import.meta.url));
    return existsSync(compiled) ? compiled : fileURLToPath(new URL("./host.ts", import.meta.url));
}

/** One player = one node process, isolated from the engine and from the other players */
export class ProcessPlayer implements BotPlayer {
    readonly name: string;
    private child?: ChildProcess;
    private lines: string[] = [];
    private stdoutRest = "";
    private stderrRest = "";
    private ready = false;
    private exit?: string;
    private wakeUps: Array<() => void> = [];

    constructor(
        private scriptPath: string,
        private index: number,
        private options: ProcessPlayerOptions = {},
    ) {
        this.name = `${index}:${basename(scriptPath)}`;
    }

    async start(): Promise<void> {
        // `import.meta.resolve` is not available when this file itself is run through tsx
        const tsx = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;
        const child = spawn(
            process.execPath,
            ["--import", tsx, getHostPath(), this.scriptPath],
            { stdio: ["pipe", "pipe", "pipe"] },
        );
        this.child = child;

        child.stdout!.setEncoding("utf8");
        child.stdout!.on("data", (data: string) => this.onStdout(data));
        child.stderr!.setEncoding("utf8");
        child.stderr!.on("data", (data: string) => this.onStderr(data));
        child.stdin!.on("error", () => {}); // EPIPE when the player already died
        child.on("error", (error) => this.onExit(`failed to start: ${error.message}`));
        child.on("exit", (code, signal) => {
            this.onExit(`process exited (${signal ?? `code ${code}`})`);
        });

        try {
            await this.waitUntil(() => this.ready, STARTUP_TIMEOUT_MS);
        } catch (error) {
            throw new PlayerFailure("start", (error as Error).message);
        }
    }

    send(lines: string[]): void {
        if (lines.length && !this.exit) {
            this.child?.stdin!.write(lines.join("\n") + "\n");
        }
    }

    async read(count: number, timeoutMs: number): Promise<string[]> {
        if (count <= 0) {
            return [];
        }
        await this.waitUntil(() => this.lines.length >= count, timeoutMs);
        return this.lines.splice(0, count);
    }

    async stop(): Promise<void> {
        const child = this.child;
        if (!child || this.exit) {
            return;
        }
        child.stdin!.end();
        child.kill("SIGKILL");
        await this.waitUntil(() => !!this.exit, 2000).catch(() => {});
    }

    private onStdout(data: string): void {
        this.stdoutRest += data;
        let index: number;
        while ((index = this.stdoutRest.indexOf("\n")) >= 0) {
            const line = this.stdoutRest.slice(0, index).replace(/\r$/, "");
            this.stdoutRest = this.stdoutRest.slice(index + 1);
            if (line === READY_MARKER) {
                this.ready = true;
            } else {
                this.lines.push(line);
            }
        }
        this.wakeAll();
    }

    private onStderr(data: string): void {
        this.stderrRest += data;
        let index: number;
        while ((index = this.stderrRest.indexOf("\n")) >= 0) {
            const line = this.stderrRest.slice(0, index);
            this.stderrRest = this.stderrRest.slice(index + 1);
            this.options.forwardStderr && console.error(`[player ${this.name}] ${line}`);
        }
    }

    private onExit(reason: string): void {
        this.exit = this.exit ?? reason;
        this.wakeAll();
    }

    private wakeAll(): void {
        const wakeUps = this.wakeUps;
        this.wakeUps = [];
        wakeUps.forEach((wakeUp) => wakeUp());
    }

    private async waitUntil(predicate: () => boolean, timeoutMs: number): Promise<void> {
        const deadline = Date.now() + timeoutMs;
        while (!predicate()) {
            if (this.exit) {
                throw new PlayerFailure("crash", this.exit);
            }
            const remaining = deadline - Date.now();
            if (remaining <= 0) {
                throw new PlayerFailure("timeout", `no answer within ${timeoutMs}ms`);
            }
            await new Promise<void>((resolve) => {
                const timer = setTimeout(resolve, Math.min(remaining, MAX_TIMER_MS));
                this.wakeUps.push(() => {
                    clearTimeout(timer);
                    resolve();
                });
            });
        }
    }
}
