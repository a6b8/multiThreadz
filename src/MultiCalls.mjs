import os from 'os'

import { config } from './data/config.mjs'
import { Workers } from './Workers/Workers2.mjs'
import { PrintConsole } from './Status/PrintConsole.mjs'


export class MultiCalls {
    #config
    #workers
    #printConsole

    #state
    #data
    #sharedData


    constructor() {
        this.#config = config

        return true
    }


    init() {
        this.#workers = new Workers( { 
            'workers': this.#config['workers']
        } )

        this.#printConsole = new PrintConsole( {
            'workers': this.#config['workers']
        } )

        this.#data = this.#addExampleData()

        return true
    }


    async start() {
        this.#data['chunks'].forEach( ( chunks, thread ) => {
            this.#workers.updateQueue( { thread, chunks } )
        } )

        const tmp = await Promise.all( 
            this.#data['chunks'].map( async ( chunks, thread ) => {
                const result = await this.#workers.start( { 
                    thread, 
                    chunks
                } )

                console.log( `Thread: ${thread} is finished. Result is ${result}`)
                return result
            } )
        )

        console.log( `All Data result is ${tmp}` )
 
        return true
    }


    #addExampleData() {
        const data = new Array( this.#config['example']['length'] )
            .fill( '' )
            .map( ( a, index ) => {
                const result = {
                    'workerId': index % this.#config['workers']['threads'],
                    'time': Math.floor( Math.random() * ( 2000 - 500 + 1 ) ) + 500
                }
                return result
            } )

        const byWorker = data.reduce( ( acc, cur ) => {
            if( !acc[ cur['workerId'] ] ) {
                acc[ cur['workerId'] ] = []
            }
            acc[ cur['workerId'] ].push( cur )
            return acc
        }, {} )

        const chunkSize = this.#config['workers']['maxChunkSize']
        const chunks = Object
            .keys( byWorker )
            .map( ( workerId ) => {
                const chunk = byWorker[ workerId ]
                    .reduce( ( acc, cur, index ) => {
                        const chunkIndex = Math.floor( index / chunkSize )
                        if( !acc[ chunkIndex ] ) {
                            acc[ chunkIndex ] = []
                        }

                        acc[ chunkIndex ].push( cur )
                        return acc
                    }, [] )
                return chunk
            } )

        return { data, chunks }
    }
}