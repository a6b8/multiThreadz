import { MultiThreadz, getExamplePayloads } from '../src/MultiThreadz.mjs'
 

const mt = new MultiThreadz( { 
    'threads': 8,
    'workerPath': './tests/template/worker.mjs',
    'maxChunkSize': 100
} )

const { payloads } = getExamplePayloads( { 
    'size': 1_000, //2_000_000, 
    'markers': [ 'abc', 'test', 'unknown' ], 
    'min': 10, 
    'max': 100 
} )

mt.setPayloads( { 
    payloads, 
    'constraints': {
        'abc': 50,
        'test': 40,
        'unknown': 500
    } 
} )

const ids = await mt.start()

console.log( ids.length )
console.log( 'FINISHED' )  
