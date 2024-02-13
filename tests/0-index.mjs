import { MultiThreadz } from '../src/MultiThreadz.mjs'
import { config } from '../src/data/config.mjs'


function getExampleData() {
    const data = new Array( config['example']['length'] )
        .fill( '' )
        .map( ( a, index ) => {
            const result = {
                'workerId': index % config['workers']['threads'],
                'time': Math.floor( Math.random() * ( 2000 - 500 + 1 ) ) + 500
            }
            return result
        } )

    const byWorker = data.reduce( ( acc, cur ) => {
        if( !acc[ cur['workerId'] ] ) {
            acc[ cur['workerId'] ] = []
        }
        acc[ cur['workerId'] ].push( cur )
        return acc
    }, {} )

    const chunkSize = config['workers']['maxChunkSize']
    const chunks = Object
        .keys( byWorker )
        .map( ( workerId ) => {
            const chunk = byWorker[ workerId ]
                .reduce( ( acc, cur, index ) => {
                    const chunkIndex = Math.floor( index / chunkSize )
                    if( !acc[ chunkIndex ] ) {
                        acc[ chunkIndex ] = []
                    }

                    acc[ chunkIndex ].push( cur )
                    return acc
                }, [] )
            return chunk
        } )

    return { data, chunks }
}



const multiThreadz = new MultiThreadz()

await multiThreadz.start()
// await multiCall.start()