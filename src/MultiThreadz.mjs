import { config } from './data/config.mjs'
import { Workers } from './Workers/Workers.mjs'

import { objectToBuffer } from './helpers/mixed.mjs'


export class MultiThreadz {
    #config
    #workers
    #queue


    constructor( { threads, workerPath }) {
        this.#config = config
        this.#workers = new Workers( { 
            threads, workerPath
        } )

        this.#queue = this.#addQueue()

        return true
    }


    setData( { data } ) {
        data
            .forEach( ( chunk, index ) => {
                const result = {
                    'marker': null,
                    'buffer': null
                }

                if( chunk?.marker ) {
                    result['marker'] = chunk['marker']
                    delete chunk['marker']
                } else {
                    result['marker'] = this.#config['queue']['defaultMarker']
                }

                result['buffer'] = objectToBuffer( { 'obj': chunk } )
                this.#queue['pending'].push( result )
                return true
            } )

        return this
    }


    start() {
        this.#workers.start()
    }


    health() {
        return true
    }


    #addQueue() {
        const result = {
            'pending': [],
            'done': []
        }

        return result
    }
}