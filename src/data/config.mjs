export const config = {
    'workers': {
        'threads': 1,
        'maxChunkSize': 8,
        'templates': {
            'standard': './src/Workers/worker.mjs'
        }
    },
    'example': {
        'length': 50
    }
}