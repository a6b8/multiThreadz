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
        const unixTimestamp = Math.floor(Date.now() / 1000)
        let r = data
            .map( ( item, index ) => {
                const name = item?.marker ? item['marker'] : this.#config['queue']['default']['markerName']
                const result = {
                    'id': `${unixTimestamp}-${index}`,
                    'marker': {
                        'index': null,
                        name
                    },
                    'data': item
                }

                return result
            } )

        const _constraints = Object
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

        this.setConstraints( { 'constraints': _constraints } )
        const results = r
            .map( ( item, index ) => {
                item['marker']['index'] = this.#state['constraints']['shared']['order'] 
                    .findIndex( ( a ) => a === item['marker']['name'] ) 
                delete item['data']['marker']
                return item
            } )
 
        this.#queue['pending'].push( ...results )

        return this
    }


    setConstraints( { constraints } ) {
        this.#state['constraints'] = {
            'byMarker': {},
            'shared': {
                'order': Object.keys( constraints ),
                'buffer': null
            }
        }

        this.#state['constraints']['byMarker'] = Object
            .entries( constraints )
            .reduce( ( acc, a, index ) => {
                acc[ a[ 0 ] ] = a[ 1 ]
                acc[ a[ 0 ] ]['index'] = this.#state['constraints']['shared']['order'] 
                    .findIndex( ( b ) => b === a[ 0 ] ) 
                return acc
            }, {} )

        const values = Object.values( constraints )
        const sab = new SharedArrayBuffer( values.length * Int32Array.BYTES_PER_ELEMENT )
        this.#state['constraints']['shared']['buffer'] = new Int32Array( sab )

        values
            .forEach( ( value, index ) => { 
                this.#state['constraints']['shared']['buffer'][ index ] = 0
            } )

        return true
    }


    async start() {
        this.#workers = new Workers( { 
            'threads': this.#state['threads'],
            'workerPath': this.#state['workerPath'],
            'constraints': this.#state['constraints']['shared']['buffer'],
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
         let status = true

        if( this.#queue['pending'].length === 0 ) {
            status = false
        }

        const chunk = Object
            .entries( this.#state['constraints']['byMarker'] )
            .sort( ( a, b ) => a[ 1 ]['maxConcurrentProcesses'] - b[ 1 ]['maxConcurrentProcesses'] )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                const currentProcesses = Atomics.load( this.#state['constraints']['shared']['buffer'], value['index'] )
                const maxProcesses = value['maxConcurrentProcesses']
                const delta = maxProcesses - currentProcesses

                const findings = this.#queue['pending']
                    .filter( ( b ) => b['marker']['index'] === value['index'] )
                    .filter( ( b, index ) => index < delta )
                    .forEach( ( item ) => {
                        if( acc.length < this.#config['workers']['maxChunkSize'] ) {
                            acc.push( item )
                            const index = this.#queue['pending']
                                .findIndex( c => c['id'] === item['id'] )
                            this.#queue['pending'].splice( index, 1 )
                            this.#queue['done'].push( item)   
                        }
                    } )

                return acc
            }, [] )

        this.#queue['done'].push( ...chunk )
        const buffer = objectToBuffer( { 'obj': chunk } )
        return { buffer }
    }
}