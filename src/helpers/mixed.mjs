function xyToIndex( { x, y, cols } ) {
    return x * cols + y
}


function indexToXY( { index, cols } ) {
    return {
        'x': Math.floor( index / cols ),
        'y': index % cols
    }
}


export { xyToIndex, indexToXY }