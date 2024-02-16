import { config } from './data/config.mjs'
import { Workers } from './workers/Workers.mjs'
import { PrintConsole } from './console/PrintConsole.mjs'

import { getExamplePayloads, buffersToBuffer, bufferToText } from './helpers/mixed.mjs'


class MultiThreadz {
    #workers

    #config
    #queue
    #state

    #printConsole


    constructor( { threads=1, workerPath, maxChunkSize=10 } ) {
        this.#config = config
        this.#state = {
            threads, 
            workerPath,
            maxChunkSize,
            'constraints': {},
            'nonce': null
        }
        this.#printConsole = new PrintConsole()

        const buffer = new SharedArrayBuffer( Int32Array.BYTES_PER_ELEMENT )
        const sharedUint32Array = new Uint32Array( buffer )
        this.#state['nonce'] = sharedUint32Array
        this.#state['nonce'][ 0 ] = 0

        this.#queue = this.#addQueue()

        return true
    }


    setPayloads( { payloads, constraints={} } ) {
        // console.log( payloads.length)
        const unixTimestamp = Math.floor( Date.now() / 1000 )
        const key = [ 'id', 'payloadEncoded' ]

        let markerCount = 0

        this.#queue['pending'] = new Map()
        this.#queue['pending'].set( 'byMarkerLookUp', new Map() )
        this.#queue['pending'].set( 'byMarker', new Map() )
 
        payloads
            .forEach( ( item, index ) => {
                const name = item?.marker ? item['marker'] : this.#config['queue']['default']['markerName']
                
                if( !this.#queue['pending'].get('byMarker').has( name ) ) {
                    this.#queue['pending']
                        .get('byMarker')
                        .set( name, [] )
                    
                    this.#queue['pending']
                        .get('byMarkerLookUp')
                        .set( name, markerCount )
                    markerCount++
                }

                item['markerIndex'] = this.#queue['pending'].get('byMarkerLookUp').get( name )
                delete item['marker']
                const struct = [
                    `${unixTimestamp}-${index}`,
                    Buffer.from( JSON.stringify( item ), 'utf-8')
                ]

                this.#queue['pending']
                    .get( 'byMarker' )
                    .get( name )
                    .push( struct )

                return true
            } )

        const constraintsKeys = Object.keys( constraints )
        const _constraints = [ ...this.#queue['pending'].get('byMarker').keys() ]
            .map( ( key ) => [ key, this.#queue['pending'].get('byMarker').get( key ).length ] )
            .map( ( [ name, count ] ) => {
                const result  = { name, count }
                if( constraintsKeys.includes( name )) {
                    result['maxConcurrentProcesses'] = constraints[ name ]
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

        this.#setConstraints( { 'constraints': _constraints } )

        return true
    }


    async start( silent=false ) {
        this.#workers = new Workers( { 
            'threads': this.#state['threads'],
            'workerPath': this.#state['workerPath'],
            'constraints': this.#state['constraints']['shared']['buffer'],
            'nonce': this.#state['nonce']
        } )

        const markersTotal = [ ...this.#queue['pending'].get('byMarker').keys() ]
            .reduce( ( acc, key ) => {
                acc[ key ] = this.#queue['pending'].get('byMarker').get( key ).length
                return acc
            }, {} )

        this.#printConsole.init( {
            'nonce': this.#state['nonce'],
            'buffer': this.#state['constraints']['shared']['buffer'],
            'threads': this.#state['threads'],
            markersTotal,
            silent
        } )

        const results = await Promise.all(
            new Array( this.#state['threads'] )
                .fill( '' )
                .map( async( a, thread ) => {
                    const result = await this.#callTask( { thread } )
                    return result
                } )
        )

        return results.flat( 1 )
    }


    health() {
        return true
    }


    #setConstraints( { constraints } ) {
        this.#state['constraints'] = {
            'byMarker': {},
            'shared': {
                'order': null,
                'buffer': null
            }
        }

        this.#state['constraints']['shared']['order'] = Array
            .from( this.#queue['pending'].get('byMarkerLookUp') )
            .sort( ( a, b ) => a[ 1 ] - b[ 1 ] )
            .map( ( a ) => a[ 0 ] )

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


    async #callTask( { thread, row=0, results=[] } ) {
        const { types, status, buffer } = this.#getChunkEncoded()

        this.#printConsole.updateState( { 
            thread, 
            row,
            types
        } )

        this.#printConsole.printState()
        if( status === true ) {
            const ids = await this.#workers.start( { 
                thread, 
                buffer
            } )

            results.push( ...ids )

            row++
            await this.#callTask( { thread, row, results } ) 
        } else {
        }

        return results
    }


    #addQueue() {
        const result = {
            'pending': [],
            'done': []
        }

        return result
    }


    #getChunkEncoded() {
        let status = true
        const types = {}

        const l = [ ...this.#queue['pending'].get('byMarker').keys() ]
            .reduce( ( acc, key ) => {
                acc += this.#queue['pending'].get('byMarker').get( key ).length
                return acc
            }, 0 )

        if( l === 0 ) {
            status = false
            return { status, 'buffer': null, types }
        }

        const buffer = Object
            .entries( this.#state['constraints']['byMarker'] )
            .sort( ( a, b ) => a[ 1 ]['maxConcurrentProcesses'] - b[ 1 ]['maxConcurrentProcesses'] )
            .reduce( ( acc, a, index, all ) => {
                const [ key, value ] = a
                
                if( acc.length < this.#state['maxChunkSize'] ) {
                    let maxConstraints = value['maxConcurrentProcesses'] - this.#state['constraints']['shared']['buffer'][ value['index'] ]
                    maxConstraints = maxConstraints < 0 ? 0 : maxConstraints
                    const sizeLeft = this.#state['maxChunkSize'] - acc.length 
                    let use = maxConstraints
                    maxConstraints > sizeLeft ? use = sizeLeft : ''

                    if( use > 0 ) {
                        const item = this.#queue['pending']
                            .get('byMarker')
                            .get( key )
                            .splice( 0, use )
                        acc.push( ...item )

                        if( !Object.hasOwn( types, key ) ) {
                            types[ key ] = 0
                        }
                        types[ key ] += item.length
                    }

                } else {
                    status = false
                }

                if( all.length - 1 === index ) { 
                    acc = buffersToBuffer( { 'buffers': acc } )
                }

                return acc
            }, [] )

        return { status, buffer, types }
    }
}


export { MultiThreadz, getExamplePayloads, bufferToText }