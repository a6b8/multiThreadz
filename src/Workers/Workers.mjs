import { Worker } from 'worker_threads'


export class Workers {
    #config
    #workers


    constructor( { thread, workerPath } ) {
        this.#config = { thread, workerPath }
        this.#workers = this.#addWorkers()

        return true
    }


    async start() {

        return true
    }


    #addWorkers() {
        const workers = new Array( this.#config['thread'] )
            .fill( '' )
            .map( ( a, index ) => {
                const worker = new Worker( this.#config['workerPath'] )
                return worker
            } )

        return workers
    }
}