import { parentPort, workerData } from 'worker_threads'
import { bufferToText } from '../MultiThreadz.mjs'


function delayedPromise( time ) {
    return new Promise( ( resolve ) => {
        setTimeout(() => { resolve( true ) }, time )
    } )
}


const { constraints } = workerData
parentPort.once(
    'message', 
    async( buffer ) => {
        const txt = bufferToText( buffer )
        const data = JSON.parse( txt )

        const ids = await Promise.all(
            data['data']
                .map( async( item, index ) => {
                    const [ id, str ] = item
                    const { markerIndex, time } = JSON.parse( str )

                    Atomics.add( constraints, markerIndex, 1 )
                    await delayedPromise( time )
                    Atomics.sub( constraints, markerIndex, 1 )

                    return id
                } )
        )

        parentPort.postMessage( ids )
    } 
)