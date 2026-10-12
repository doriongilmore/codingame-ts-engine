// shape of a script produced by buildForCodingame: no export, global readline, main called at the end
declare function readline(): string;

function main(readline: () => string): void {
    while (true) {
        readline();
        console.log("3");
    }
}

main(readline);
