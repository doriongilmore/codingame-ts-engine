/** printed on stdout by the host once the player process is up, before the script is loaded */
export const READY_MARKER = "@@codingame-ts-engine:ready@@";

/**
 * printed on stdout by the host each time the script is about to wait for input on `readline()`.
 * Followed by the number of lines the script consumed so far and `@@`: when it equals the number of
 * lines the engine sent, the script has read everything and finished its turn, so what it wrote
 * before this marker is its complete answer.
 */
export const IDLE_PREFIX = "@@codingame-ts-engine:idle:";
export const IDLE_SUFFIX = "@@";
