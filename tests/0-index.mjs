import { MultiThreadz } from '../src/MultiThreadz.mjs'
import { config } from '../src/data/config.mjs'


function getExampleData( { size, markers } ) {
    const data = new Array( size )
        .fill( '' )
        .map( ( a, index ) => {
            const randomIndex = Math.floor( Math.random() * markers.length )
            const result = {
                'marker': markers[ randomIndex ]['marker'],
                'time': Math.floor( Math.random() * ( 2000 - 500 + 1 ) ) + 500
            }
            return result
        } )

    return { data }
}




const markers = [ 
    {
        'marker': 'abc'
    },
    {
        'marker': 'test'
    },
    {
        'marker': 123
    }
]

const mt = new MultiThreadz( { 
    'threads': 2,
    'workerPath': './src/Workers/worker.mjs'
} )

const { data } = getExampleData( { 'size': 100, markers } )
mt.setData( { data } )
mt.start()