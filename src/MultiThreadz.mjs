import { config } from './data/config.mjs'
import { Workers } from './Workers/Workers2.mjs'

import { objectToBuffer } from './helpers/mixed.mjs'


export class MultiThreadz {
    #workers


    constructor() {
        this.#workers = new Workers( { 
            'workers': config['workers']
        } )

        return true
    }


    addData( { chunks } ) {
        const transformedChunks = chunks
            .map( chunk => {
                const buffer = objectToBuffer( { 'obj': chunk } )
                const result = { thread, buffer }
                return result
            } )

        return true
    }


    start() {
        this.#workers.start()
    }


    health() {
        return true
    }
}