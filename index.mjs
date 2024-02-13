import { MultiCalls } from './src/MultiCalls.mjs'

const multiCalls = new MultiCalls()
multiCalls.init()

await multiCalls.start()
// await multiCall.start()