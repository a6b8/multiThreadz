


export class Workers {
    #config
    #queue


    constructor( { workers } ) {
        this.#config = { workers }
        this.#queue = this.#addQueue()

        return true

    }


    async start() {

        return true
    }


    updateQueue( { thread, chunks } ) {
        const encoder = new TextEncoder()

        const transformedChunks = chunks
            .map( chunk => {
                const str = JSON.stringify( chunk )
                const uint8Array = encoder.encode( str )
                const buffer = uint8Array.buffer
                console.log( chunk )
                console.log( '---' )
                const result = {
                    thread,
                    // chunk
                    buffer
                }

                return result
            } )
        return true
    }


    #addQueue() {
        // const queue = 
        
        /*
        new Array( this.#config['workers']['threads'] )
            .fill( '' )
            .reduce( ( acc, a, index ) => {
                acc[ index ] = {
                    'done': [],
                    'pending': []
                }
                return acc
            }, {} )
        */

        return true
    }



}