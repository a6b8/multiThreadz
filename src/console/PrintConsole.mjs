export class PrintConsole {
    #state


    constructor() {
    }


    init( { nonce, buffer, threads, markersTotal } ) {
        this.#state = this.#addState( { nonce, buffer, threads, markersTotal } )

        return true
    }


    updateState( { thread, row, chunkLength, types } ) {
        this.#state['byThread'][ thread ] = {
            row, chunkLength
        }

        Object
            .entries( types )
            .forEach( ( a, index ) => {
                const [ key, value ] = a
                this.#state['byMarker'][ key ]['current'] += value
            } )

        // console.log( `${thread} ${this.#state['threads'][ thread ]['row']}` )

        return true
    }


    printState() {
        if( this.#state['firstLine'] === true ) {
            const headline = [
                [ 'NONCE',      6, 0 ],
                [ 'THREADS',    3, this.#state['byThread'].length ],
                [ 'BY MARKER', 15, this.#state['byMarker'].length ]
            ]
                .map( ( [ headline, pad, times ], index, all ) => {
                    const add = ( index !== 0 ) ? 2 : 0
                    return headline.padEnd( pad * ( times + 1 ) + add, ' ' )
                } )
                .join( ' | ' )

            console.log( headline )
            this.#state['firstLine'] = false
        }  

        const line = [
            `${Atomics.load( this.#state['nonce'], 0 )}`.padEnd( 6, ' '),
            this.#createByThread( { 'pad': 3 } ),
            this.#createByMarker( { 'pad': 15 } )
        ]
            .join( ' | ' )

        process.stdout.write('\r')
        process.stdout.clearLine()
        process.stdout.write( line )

        return true
    }


    #createByThread( { pad=3 } ) {
        return this.#state['byThread']
            .map( ( a, index ) => `${a['row']}`.padEnd( pad, ' ' ) )
            .join( ' ' )
    }


    #createByMarker( { pad=15 } ) {
        return Object
            .entries( this.#state['byMarker'] )
            .map( ( [ key, value ] ) => {
                const { current, total } = value
                const percent = Math.round( ( current / total ) * 100 )
                return `${percent}% (${current}/${total})`.padEnd( pad, ' ' )
            } )
            .join( ' ' )
    }


    #addState( { nonce, buffer, threads, markersTotal } ) {
        const state = {
            'firstLine': true,
            nonce, 
            buffer,
            'byThread': [],
            'byMarker': {}
        }

        state['byThread'] = new Array( threads )
            .fill( '' )
            .reduce( ( acc, a, index ) => {
                const stats = {
                    'chunkLength': 0,
                    'row': 0
                }

                acc.push( stats )
                return acc
            }, [] )

        state['byMarker'] = Object
            .entries( markersTotal )
            .reduce( ( acc, a, index ) => {
                const [ key, value ] = a
                acc[ key ] = {
                    'total': value,
                    'current': 0
                }

                return acc
            }, {} )

    
        return state
    }
}