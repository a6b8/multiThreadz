const encoder = new TextEncoder()


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
    const uint8Array = encoder.encode( str )
    const buffer = uint8Array.buffer
    return buffer
}


function bufferToText( buffer ) {
    const uint8Array = new Uint8Array( buffer )
    const str = encoder.decode( uint8Array )
    return str
}


export { xyToIndex, indexToXY, textToBuffer, bufferToText, objectToBuffer }