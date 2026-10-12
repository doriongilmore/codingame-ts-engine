/** To be thrown by `Referee.update` when a player answered something illegal */
export class InvalidMove extends Error {
    constructor(public player: number, reason: string) {
        super(`player ${player}: ${reason}`);
        this.name = "InvalidMove";
    }
}
