export class PrintConsole {
    #state


    constructor() {
    }


    init( { nonce, buffer, threads, markersTotal, silent } ) {
        this.#state = this.#addState( { nonce, buffer, threads, markersTotal, silent } )

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



    printState( cfg={ noncePad:20, threadsPad:3, byMarkerPad:16 } ) {
        if( this.#state['silent'] === true ) {
            return true
        }

        if( this.#state['firstLine'] === true ) {
            const headline = [
                [ 'NONCE',      cfg.noncePad,    0 ],
                [ 'THREADS',    cfg.threadsPad,  this.#state['byThread'].length ],
                [ 
                    this.#createTotal( { 'pad': cfg.byMarkerPad, 'headline': true } ),
                    cfg.byMarkerPad, 
                    this.#state['byMarker'].length 
                ]
            ]
                .map( ( [ headline, pad, times ], index, all ) => {
                    const add = ( index !== 0 ) ? 0 : 0
                    return headline.padEnd( pad * ( times + 1 ) + add, ' ' )
                } )
                .join( ' | ' )

            console.log( headline )
            this.#state['firstLine'] = false
        } 

        const line = [
            // `${Atomics.load( this.#state['nonce'], 0 )}`.padEnd( 6, ' '),
            this.#createTotal( { 'pad': cfg.noncePad } ),
            this.#createByThread( { 'pad': cfg.threadsPad } ),
            this.#createByMarker( { 'pad': cfg.byMarkerPad } )
        ]
            .join( ' | ' )

        process.stdout.write( '\r' )
        process.stdout.clearLine()
        process.stdout.write( line )

        return true
    }


    #createTotal( { pad, headline=false } ) {
        if( headline === true ) {
            return Object
                .entries( this.#state['byMarker'] )
                .map( ( [ key, value ] ) => {
                    return key.padEnd( pad, ' ' )
                } )
                .join( ' ' )
        } else {
            return Object
                .entries( this.#state['byMarker'] )
                .reduce( ( acc, [ key, value ], index, all ) => {
                    acc[ 0 ] += value['current']
                    acc[ 1 ] += value['total']
                    if( all.length - 1 === index ) {
                        const [ current, total ] = acc
                        const percent = Math.round( ( current / total ) * 100 )
                        acc = `${percent}% (${current}/${total})`.padEnd( pad, ' ' )
                    }
                    return acc
                }, [ 0, 0 ] )
        }
    }


    #createByThread( { pad } ) {
        return this.#state['byThread']
            .map( ( a, index ) => {
                return `${a['row']}`.padEnd( pad, ' ' )
            } )
            .join( ' ' )
    }


    #createByMarker( { pad } ) {
        return Object
            .entries( this.#state['byMarker'] )
            .map( ( [ key, value ], index ) => {
                const { current, total } = value
                const percent = Math.round( ( current / total ) * 100 )
                let str = `${percent}% (${current}/${total})`.padEnd( pad, ' ' )
                // let str = `${percent}% (${this.#state['buffer'][ index ]})`.padEnd( pad, ' ' )
                return str
            } )
            .join( ' ' )
    }


    #addState( { nonce, buffer, threads, markersTotal, silent } ) {
        const state = {
            silent,
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