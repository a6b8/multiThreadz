import { Worker } from 'worker_threads'


export class Workers {
    #config
    #workers


    constructor( { threads, workerPath, constraints, nonce } ) {
        this.#config = { threads, workerPath, constraints, nonce }
        console.log( '>>>', this.#config)
        this.#workers = this.#addWorkers()

        return true
    }


    async start( { thread, buffer } ) {
        return new Promise( ( resolve, reject ) => {
            const worker = this.#workers[ thread ]
            worker.on( 
                'message', 
                ( msg ) => {
                    console.log('Received data from worker:', msg)
                    resolve( true )
                }
            )

            worker.postMessage( buffer, [ buffer ] )
        } )
    }


    #addWorkers() {
        const workers = new Array( this.#config['threads'] )
            .fill( '' )
            .map( ( a, index ) => {
                const worker = new Worker( 
                    this.#config['workerPath'],
                    { 
                        'workerData': { 
                            'constraints': this.#config['constraints'],
                            'nonce': this.#config['nonce']                        
                        } 
                    }
                )
                return worker
            } )

        return workers
    }
}