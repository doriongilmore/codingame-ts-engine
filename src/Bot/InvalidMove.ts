/**
 * To be thrown by `Referee.parsePlay` or `Referee.validatePlay` when a player did not respect the rules.
 * The engine knows which player it is about and eliminates it with this reason.
 */
export class InvalidMove extends Error {
    constructor(public reason: string) {
        super(reason);
        this.name = "InvalidMove";
    }
}
