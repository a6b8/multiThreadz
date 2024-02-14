import { parentPort, workerData } from 'worker_threads'
import { xyToIndex, indexToXY, bufferToText } from '../helpers/mixed.mjs' 


function delayedPromise( time ) {
    return new Promise( ( resolve ) => {
      setTimeout(() => {
        resolve( true );
      }, time );
    } )
}


parentPort.once(
    'message', 
    async( buffer ) => {
        const txt = bufferToText( buffer )
        const data = JSON.parse( txt )

        const test = await Promise.all(
            data
                .map( async( item, index ) => {
                    Atomics.add(
                        workerData['constraints'], 
                        item['marker']['index'], 
                        1
                    )

                    await delayedPromise( item.data.time )
                    const { markerIndex } = item

                    Atomics.sub(
                        workerData['constraints'], 
                        item['marker']['index'], 
                        1
                    )

                    Atomics.add(
                        workerData['nonce'],
                        0,
                        1
                    )

                    // console.log( 'Index', index, 'done')
                     console.log( 'w', workerData )
                    return true
                } )
        )

        console.log( 'Worker done' )
        // Once the task is complete, send a response back to the main thread
        parentPort.postMessage('Message received by worker');

    } 
)