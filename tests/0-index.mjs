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
        'marker': 'abc',
        'contraint': 23,
    },
    {
        'marker': 'test',
        'contraint': 3,
    },
    {
        'marker': '123'
    }
]

const mt = new MultiThreadz( { 
    'threads': 20,
    'workerPath': './src/Workers/worker.mjs'
} )

const constraints = markers
    .reduce( ( acc, a, index ) => {
        a?.contraint ? acc[ a['marker'] ] = a['contraint'] : ''
        return acc
    }, {} )

// mt.setConstraints( { constraints } )

const { data } = getExampleData( { 'size': 200, markers } )
mt.setData( { data, constraints } )

await mt.start()