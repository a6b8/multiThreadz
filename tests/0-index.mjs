import { MultiThreadz } from '../src/MultiThreadz.mjs'
import { getExampleData } from '../src/helpers/mixed.mjs'
 

const mt = new MultiThreadz( { 
    'threads': 6,
    'workerPath': './src/Workers/worker.mjs'
} )

const { data } = getExampleData( { 
    'size': 200000, 
    'markers': [ 'abc', 'test', 'unknown' ], 
    'min': 10, 
    'max': 100 
} )

mt.setData( { 
    data, 
    'constraints': {
        'abc': 23,
        'test': 10
    } 
} )

await mt.start()
console.log()
console.log( 'FINISHED' )  