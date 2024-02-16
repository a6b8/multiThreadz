import { MultiThreadz } from './../src/MultiThreadz.mjs'


const mt = new MultiThreadz( { 
    'threads': 8,
    'workerPath': './tests/template/worker.mjs',
    'maxChunkSize': 100
} )

const result = mt.health()

if( result ) {
    console.log( 'Success' )
    process.exit( 0 )
} else {
    console.log( 'Error' )
    process.exit( 1 )
}