


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