export class PrintConsole {
    #state

    constructor() {
        this.#state = {
            'constraints': {}
        }
    }

    
    setContraints( { buffer } ) {
        this.#state['constraints'] = buffer
        return true
    }
}