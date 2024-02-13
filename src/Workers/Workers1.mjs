import { Worker, isMainThread, workerData } from 'worker_threads'
import { indexToXY } from '../helpers/mixed.mjs'


export class Workers {
    #config
    #sharedData
    #workers
    #queue
    #state


    constructor( { workers }) {
        this.#config = { workers }
/*
        this.#workers = this.#addWorkers()
*/
        this.#queue = this.#addQueue()

        const sharedBuffer = new SharedArrayBuffer( 0 * 4 )
        this.#sharedData = new Int32Array( sharedBuffer )

        return true
    }


    updateQueue( { thread, chunks } ) {
        this.#queue[ thread ]['pending'] = this.#queue[ thread ]['pending'].concat( chunks )

        const allQueueLengths = new Array( this.#config['workers']['threads'] )
            .fill( '' )
            .reduce( ( acc, a, index ) => {
                acc[ index ] = [
                    this.#queue[ thread ]['done'].length,
                    this.#queue[ thread ]['pending'].length
                ]
                    .reduce( ( acc, a ) => { 
                        acc = acc + a
                        return acc 
                    }, 0 )
                return acc
            }, [] )

        const otherHigestRow = allQueueLengths
            .filter( ( a, index ) => index !== thread )
            .reduce( ( acc, a ) => {    
                if( a > acc ) { acc = a }
                return acc
            }, 0 )

        if( allQueueLengths[ thread ] > otherHigestRow ) {
            const newRows = allQueueLengths[ thread ] - otherHigestRow
            this.#increaseSharedData( { newRows } )
        }

        return true
    }


    async start( { thread } ) {    

// process.exit( 1 )   
        while( this.#queue[ thread ]['pending'].length > 0 ) {
            //console.log( this.#sharedData )
            const chunk = this.#queue[ thread ]['pending'].shift()
            this.#queue[ thread ]['done'].push( chunk )

            const row = this.#queue[ thread ]['pending'].length + this.#queue[ thread ]['done'].length

            await this.#callWorker( { 
                thread,
                chunk,
                row
            } )
        }

        return true
    }


    getSharedData() {
        return this.#sharedData
    }

/*
    #addWorkers() {
        const workers = new Array( this.#config['workers']['threads'] )
            .fill( '' )
            .map( ( a, index ) => {
                const w = new Worker( 
                    this.#config['workers']['templates']['standard'], 
                    { 'workerData': { 'sharedData': this.#sharedData } }
                )

                return w
            } )

        return workers
    }
*/

    #addState() {
        const state = {
            'cols': null,
            'rows': {}
        }

        state['cols'] = this.#config['workers']['maxChunkSize'] * this.#config['workers']['threads'] 

        state['rows'] = new Array( this.#config['workers']['threads'] )
                .fill( '' )
                .reduce( ( acc, a, index ) => {
                    acc[ index ] = 0
                    return acc  
                }, {} )

        return state
    }


    #addQueue() {
        const queue = new Array( this.#config['workers']['threads'] )
            .fill( '' )
            .reduce( ( acc, a, index ) => {
                acc[ index ] = {
                    'done': [],
                    'pending': []
                }
                return acc
            }, {} )

        return queue
    }


    async #callWorker( { thread, row, chunk } ) {
        return new Promise( ( resolve, reject ) => {

            const worker = new Worker( 
                './src/Workers/worker.mjs', 
                { 'workerData': { 
                        'sharedData': this.#sharedData, 
                        thread,
                        row
                    } 
                }
            ) 

            worker.on( 
                'message', 
                ( message ) => { resolve() }
            )

            worker.on(
                'error', 
                reject
            )
 
            worker.postMessage( chunk )
        } )
    }

/*
    #addSharedData() {
        const sharedData = new Array( this.#config['workers']['threads'] )
            .fill( '' )
            .reduce( ( acc, a, index ) => {
                const sharedBuffer = new SharedArrayBuffer( 0 )
                acc[ index ] = new Int32Array( sharedBuffer )
                return acc
            }, {} )

        return sharedData
    }
*/


    #increaseSharedData( { newRows } ) {
        const size = newRows * this.#config['workers']['maxChunkSize']
        console.log( `index: ${size}` )

        const addSize = ( this.#config['workers']['maxChunkSize'] * this.#config['workers']['threads'] ) * newRows
        const newSize = this.#sharedData.length + addSize

        const extendedBuffer = new SharedArrayBuffer( newSize * Int32Array.BYTES_PER_ELEMENT )
        const extendedArray = new Int32Array( extendedBuffer )

        extendedArray.set( this.#sharedData, 0 )

       //  this.#sharedData = extendedArray

        // const sharedBuffer = new SharedArrayBuffer( size * Int32Array.BYTES_PER_ELEMENT )
        // const newArray = new Int32Array(sharedBuffer);


/*
        const combinedLength = this.#sharedData.length + newArray.length

        const old = this.#sharedData

        const sharedBuffer = new SharedArrayBuffer( size * 4 )
        this.#sharedData = new Int32Array(combinedLength)


        this.#sharedData.set( old, 0 )
        this.#sharedData.set( newArray, this.#sharedData.length )
*/
        return true
    }
}