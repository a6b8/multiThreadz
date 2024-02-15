function xyToIndex( { x, y, cols } ) {
    return x * cols + y
}


function indexToXY( { index, cols } ) {
    return {
        'x': Math.floor( index / cols ),
        'y': index % cols
    }
}


function objectToBuffer( { obj } ) {
    const str = JSON.stringify( obj )
    const buffer = textToBuffer( str )
    return buffer
}


function textToBuffer( str ) {
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode( str )
    const buffer = uint8Array.buffer
    return buffer
}


function bufferToText( buffer ) {
    const uint8Array = new Uint8Array( buffer )
    const decoder = new TextDecoder();
    const str = decoder.decode( uint8Array )
    return str
}


function getExampleData( { size, markers, min, max } ) {

    const data = new Array( size )
        .fill( '' )
        .map( ( a, index ) => {
            const randomIndex = Math.floor( Math.random() * markers.length )
            const result = {
                'marker': markers[ randomIndex ],
                'time': Math.floor(Math.random() * (max - min + 1)) + min
            }
            return result
        } )

    return { data }
}


export { xyToIndex, indexToXY, textToBuffer, bufferToText, objectToBuffer, getExampleData }