import { MultiThreadz } from './../src/MultiThreadz.mjs'

const mt = new MultiThreadz( { 
    'threads': 2,
    'workerPath': './src/Workers/worker.mjs'
} )
const result = mt.health()

if( result ) {
    console.log( 'Success' )
    process.exit( 0 )
} else {
    console.log( 'Error' )
    process.exit( 1 )
}