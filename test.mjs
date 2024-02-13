import { Worker } from 'worker_threads' 

const objs = [
    {
        'key': 'value',
        'tttt': 1234
    },
    {
        'key': 'value',
        'tttt': 12345
    }
]


const str = JSON.stringify( objs[ 1 ] )

const encoder = new TextEncoder()
const uint8Array = encoder.encode( str )
const buffer = uint8Array.buffer

const worker = new Worker( './workerTest.mjs' )
worker.postMessage( buffer, [ buffer ] )


worker.on( 'message', ( msg ) => {
    console.log( msg )
} )