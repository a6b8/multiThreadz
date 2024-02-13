import { parentPort } from 'worker_threads'

parentPort.on('message', (buffer) => {
  // Step 3: Decode the ArrayBuffer back into a string
  const decoder = new TextDecoder(); // Use TextDecoder to convert from Uint8Array
  const uint8Array = new Uint8Array(buffer); // Create a Uint8Array from the ArrayBuffer
  const message = decoder.decode(uint8Array);
  const obj = JSON.parse( message )

  console.log( obj )

  parentPort.postMessage('Received and decoded your message!');
});