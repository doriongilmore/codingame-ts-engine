// file:/home/dorion/workspace/codingameEngine/template/puzzle/src/playerScript.ts



type ReadlineFunction = () => string

function main(readline: ReadlineFunction): string[] {
    /**
     * Auto-generated code below aims at helping you parse
     * the standard input according to the problem statement.
     **/
    const answer: string[] = []
    var inputs: string[] = readline().split(' ');
    const w: number = parseInt(inputs[0]);
    const h: number = parseInt(inputs[1]);
    for (let i = 0; i < h; i++) {
        const ROW: string = readline();
        console.error(ROW); // this helps you create txt files for your local environment, remove anytime
    }
    console.error("$DORION$"); // this helps you create txt files for your local environment, remove anytime
    for (let i = 0; i < h; i++) {

        // Write an answer using console.log()
        // To debug: console.error('Debug messages...');
        answer.push("answer")
        console.log('answer');
    }
    return answer;
}

main(readline);
