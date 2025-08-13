export type ReadlineFunction = () => string

export type PuzzleExerciseData = {
    inputs: string[];
    outputs: string[];
}

export interface PuzzleScript {
    main: (readline: ReadlineFunction) => string[],
}
