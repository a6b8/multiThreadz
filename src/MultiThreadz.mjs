import { config } from './data/config.mjs'
import { Workers } from './Workers/Workers.mjs'

import { objectToBuffer } from './helpers/mixed.mjs'


export class MultiThreadz {
    #workers

    #config
    #queue
    #state


    constructor( { threads, workerPath } ) {
        this.#config = config
        this.#state = {
            threads, 
            workerPath,
            'constraints': {},
            'nonce': null
        }

        const buffer = new SharedArrayBuffer( 1 )
        const sharedUint8Array = new Uint8Array( buffer )
        this.#state['nonce'] = sharedUint8Array
        this.#state['nonce'][ 0 ] = 0

        this.#queue = this.#addQueue()

        return true
    }


    setData( { data, constraints={} } ) {
        let r = data
            .map( ( item, index ) => {
                const name = item?.marker ? item['marker'] : this.#config['queue']['default']['markerName']
                const result = {
                    'marker': {
                        'index': null,
                        name
                    },
                    'data': item
                }

                return result
            } )

        const constraints = Object
            .entries(
                r
                    .reduce( ( acc, a ) => {
                        if( !Object.hasOwn( acc, a['marker']['name'] ) ) {
                            acc[ a['marker']['name'] ] = 0
                        }
                        acc[ a['marker']['name'] ]++
                        return acc
                    }, {} )
            )
            // .sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
            .map( ( a ) => {
                const result  = {
                    'name': a[ 0 ],
                    'count': a[ 1 ],
                    'maxConcurrentProcesses': null
                }

                if( constraints[ a[ 0 ] ] ) {
                    result['maxConcurrentProcesses'] = constraints[ a[ 0 ] ]
                } else {
                    result['maxConcurrentProcesses'] = this.#config['queue']['default']['maxConcurrentProcessesByMarker']
                }

                return result
            } )
            .sort( ( a, b ) => a['maxConcurrentProcesses'] - b['maxConcurrentProcesses'] )
            .reduce( ( acc, a, index ) => {
                acc[ a['name'] ] = a
                delete acc[ a['name'] ]['name']
                return acc  
            }, {} )


        console.log( 'r', allCurrentMarkers )
        process.exit( 1 )

        this.setConstraints( { constraints } )

/*
        const results = data
            .map( ( item, index ) => {
                const result = {
                    // 'marker': null,
                    'markerIndex': null,
                    // 'buffer': null
                    'data': null
                }

                const markerIndex = this.#state['constraints']['order'] 
                    .findIndex( ( a ) => a === item['marker'] ) 
                
                if( markerIndex !== -1 ) {
                   result['markerIndex'] = markerIndex 
                } else {
                    result['markerIndex'] = this.#state['constraints']['order'].length -1 
                }

                result['data'] = item

                return result
            } )
*/

        const constraintsInUse = data
            .reduce( ( acc, a, index, all ) => {
                acc.add( a['marker'] )
                if( all.length -1 === index ) {
                    acc =  Array.from( acc )
                }
                return acc
            }, new Set() )
            .map( ( name ) => {
                const result = {
                    name,
                }

                console.log( constraints )

                return result
            } )

        console.log( '>>', constraintsInUse )

        this.#queue['pending'].push( ...results )

        return this
    }


    setConstraints( { constraints } ) {
        if( constraints?.default ) {
            console.log( 'Key "default" can not set.' )
            process.exit( 1 )
        }


        constraints['default'] = this.#config['workers']['maxConstraints']
        this.#state['constraints'] = {
            'order': Object.keys( constraints ),
            'shared': null,
        }

        const values = Object.values( constraints )
        const sab = new SharedArrayBuffer( values.length * Int32Array.BYTES_PER_ELEMENT )
        this.#state['constraints']['shared'] = new Int32Array( sab )

        values
            .forEach( ( value, index ) => { 
                this.#state['constraints']['shared'][ index ] = 0
            } )

        return true
    }


    async start() {
        this.#workers = new Workers( { 
            'threads': this.#state['threads'],
            'workerPath': this.#state['workerPath'],
            'constraints': this.#state['constraints']['shared'],
            'nonce': this.#state['nonce']
        } )

        const test = await Promise.all(
            new Array( this.#state['threads'] )
                .fill( '' )
                .map( async( a, index ) => {
                    const { buffer } = this.#getChunk()
                    await this.#workers.start( { 
                        'thread': index, 
                        buffer
                    } )
                } )
        )

        return true
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


    #getChunk() {

        console.log( '>', this.#state)
process.exit( 1 )
        const chunk = this.#queue['pending'].slice( 0, 8 )
        this.#queue['done'].push( ...chunk )
        const buffer = objectToBuffer( { 'obj': chunk } )

        console.log( '>', this.#queue['done'] )
        return { buffer }
    }
}