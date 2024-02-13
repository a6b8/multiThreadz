import { parentPort, workerData } from 'worker_threads'
import { xyToIndex, indexToXY } from '../helpers/mixed.mjs' 


// console.log( 'INSIDE', workerData )
// console.log( workerData['sharedData'] )






parentPort.once(
    'message', 
    async ( chunk ) => {
        const result = await Promise.all(
            chunk.map( async ( item, col ) => {
                // row * cols + col
                const thread = workerData.thread
                const index = workerData.row * chunk.length + col
                workerData['sharedData'][ index ] = 1
console.log( workerData['sharedData'] )
                return new Promise( ( resolve ) => {
                    setTimeout( () => {
                        workerData['sharedData'][ index ] = 2
                        //console.log( `${rindex}`)
                        resolve( item )
                    }, item['time'] )
                } )
            } )
        )

        parentPort.postMessage(
            `Worker ${JSON.stringify( workerData ) } finished processing all commands. Result is ${JSON.stringify( result )}    `
        )
    } 
)