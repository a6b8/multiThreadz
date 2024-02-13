export class PrintConsole {
    #config
    #state


    constructor( { workers } ) {
        this.#config = { workers }
        return true
    }


    health() {
        console.log( 'ok' )
    }


    print( message ) {
        console.log( message )
    }
}