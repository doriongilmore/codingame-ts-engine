// file:/home/dorion/workspace/codingameEngine/template/puzzle/src/types.ts
type ReadlineFunction = () => string

// file:/home/dorion/workspace/codingameEngine/template/puzzle/src/getInputs.ts
function getInputs(readline: ReadlineFunction) {
    var rawInputs: string[] = readline().split(' ');
    const w: number = parseInt(rawInputs[0]);
    const h: number = parseInt(rawInputs[1]);
    const inputs: string[] = [];
    for (let i = 0; i < h; i++) {
        const ROW: string = readline();
        console.error(ROW); // this helps you create txt files for your local environment, remove anytime
        inputs.push(ROW)
    }
    console.error("$DORION$"); // this helps you create txt files for your local environment, remove anytime
    return inputs;
}

// file:/home/dorion/workspace/codingameEngine/template/puzzle/src/playerScript.multifile.ts

function main(readline: ReadlineFunction): string[] {
    /**
     * Auto-generated code below aims at helping you parse
     * the standard input according to the problem statement.
     **/
    const answer: string[] = []
    const inputs: string[] = getInputs(readline);
    for (let i = 0; i < inputs.length; i++) {

        // Write an answer using console.log()
        // To debug: console.error('Debug messages...');
        answer.push("answer")
        console.log('answer');
    }
    return answer;
}

main(readline);
