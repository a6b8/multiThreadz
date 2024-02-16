[![CircleCI](https://img.shields.io/circleci/build/github/a6b8/multiThreadz/main)]() ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# MultiThreadz

To distribute computational power as efficiently as possible across CPUs, this module allows distributing tasks across different threads. For this purpose, individual `payloads` are decoded into `chunks` and passed to the `worker`.

> Under Construction, only for testing.

## Quickstart

```js
import { MultiThreadz, getExamplePayloads } from '../src/MultiThreadz.mjs'
 
const mt = new MultiThreadz( { 
    'threads': 4,
    'workerPath': './tests/template/worker.mjs',
    'maxChunkSize': 42
} )

const { payloads } = getExamplePayloads({})
mt.setPayloads( { payloads } )
const ids = await mt.start()
```


## Features:
- Efficient workload distribution across multiple threads for optimal CPU utilization.
- Streamlined decoding of payloads into manageable chunks for parallel processing.
- Flexible constraint settings to control maximum concurrent processes.
- Seamless integration with various markers for payload grouping and categorization.
- Comprehensive documentation and intuitive interface for easy configuration and usage.


## Table of Contents
- [MultiThreadz](#multithreadz)
  - [Quickstart](#quickstart)
  - [Features:](#features)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Methods](#methods)
    - [constructor()](#constructor)
    - [.setPayloads](#setpayloads)
    - [.start](#start)
  - [Worker.js](#workerjs)
  - [License](#license)

## Overview

This module was created to execute parallel evaluations of blockchain data in nodejs as efficiently as possible. Due to the efficient data structure, several million payloads can be processed in parallel one after the other. Each payload expects a `marker` field, which has a name as a `string` stored. With this `marker`, the payloads are divided into further groups, and a maximum simultaneous processing can be capped, which can be important for queries over the internet.

## Methods

The `threads` and the `worker.js` file are set via the constructor. After that, the class expects the input of `payloads` and possible `constraints`. The tasks are then processed via `.start()`.

### constructor()

**Method**

```js
constructor( { threads=1, workerPath, maxChunkSize=10 } )
```

| Key          | Type     | Default | Description                                        | Required |
|--------------|----------|---------|----------------------------------------------------|----------|
| threads      | number   | 1       | Number of threads to use for processing.           | No       |
| workerPath   | string   |         | Path to the worker script.                         | Yes      |
| maxChunkSize | number   | 10      | Maximum size of chunks processed by each worker.   | No       |

**Example**  
This example creates 2 threads. Each task sent to `worker.js` carries a maximum of `20` payloads.

```js
import { MultiThreadz } from '../src/MultiThreadz.mjs'
const mt = new MultiThreadz( { 
    'threads': 2,
    'workerPath': './tests/template/worker.mjs',
    'maxChunkSize': 20
} )
```

**Returns**

```js
true
```


### .setPayloads

This method expects the payloads to be processed. Each payload is created as an object and passed in an array. Each payload should include the key `marker` to classify. If none are added, the default values from `./src/data/config.mjs` are used.

**Method**

This method expects the key `payloads` as an `array`, and optionally `constraints` as `key/value object`.

```js
.setPayloads( { payloads, constraints={} } )
```
| Key         | Type       | Default    | Description                                            | Required |
|-------------|------------|------------|--------------------------------------------------------|----------|
| payloads    | Array of Objects      |            | An array of payloads to set.                           | Yes      |
| constraints | Object     | {}         | Additional constraints to apply to the payloads.       | No       |



**Example**

This example passes 2 payloads including the optional `marker` key. `constraints` is then optionally set to specify how many simultaneous processes are allowed. Since only 2 payloads are passed, the limit is not reached, but should serve as a reference to quickly incorporate your own desired parameters.

```js
mt.setPayloads( { 
    'payloads': [
        {
            'marker': 'abc',
            'time': 233
        },
        {
            'marker': 'test',
            'time': 223
        }
    ], 
    'constraints': {
        'abc': 3,
        'test': 2
    } 
} )

```


**Returns**

```js
this
```


### .start

This method starts the processing after the payloads have been loaded via `.setPayloads`. The terminal output can optionally be suppressed (not recommended).

**Method**

```js
async start()
```

| Key     | Type    | Default | Description                      | Required |
|---------|---------|---------|----------------------------------|----------|
| silent  | boolean | false   | Turns terminal info on or off       | No       |


**Example**

This example imports the helper function `getExamplePayloads` to generate example payloads. 2 groups are created via the `marker` key, `a` and `b`, where `b` only has 10 simultaneous processes, `a

` up to 50. The processing always starts with the smallest marker unit, in this case, `b`.

The `worker.js` can be found under the heading "Worker.js".

```js
import { MultiThreadz, getExamplePayloads } from '../src/MultiThreadz.mjs'

const mt = new MultiThreadz( { 
    'threads': 2,
    'workerPath': './tests/template/worker.mjs',
    'maxChunkSize': 20
} )

const { payloads } = getExamplePayloads( { 
    'size': 100_000, 'markers': [ 'a', 'b' ], 'min': 10, 'max': 100 
} )

mt.setPayloads( { 
    payloads, 
    'constraints': { 'a': 50, 'b': 10 } 
} )

const ids = await mt.start()

console.log( 'ids length', ids.length )
```

**Return**

```
Array
```

## Worker.js

This file contains the actual work process. The process is called via `parentPort.once`. The passed `payload` is passed as a buffer for maximum efficiency. The decoding is done by the helper function `bufferToText` which can be imported via the main module. After decoding, the actual `payloads` are stored under `data` and can be processed concurrently via `promise.all`. The process is completed via `parentPort.postMessage( msg )` and the result is passed.

```js
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
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.