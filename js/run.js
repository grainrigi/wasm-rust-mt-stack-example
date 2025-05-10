const fs = require('fs');
const path = require('path');
const { Worker } = require('worker_threads');

const wasmBuffer = fs.readFileSync('target/wasm32-unknown-unknown/release/mt_overlap.wasm');
const sharedMemory = new WebAssembly.Memory({
  initial: 128,
  maximum: 1024,
  shared: true,
});

function launchWorker(stackPointer) {
  const worker = new Worker(path.join(__dirname, 'worker.js'), {
     workerData: { wasmBuffer, sharedMemory, stackPointer },
  });
  return new Promise((resolve, reject) => {
    worker.on('error', (error) => {
      console.error("Worker error: ", error);
      reject(error);
    });
    worker.on('exit', (code) => {
      resolve(code);
    });
  });
}

async function runWorkers() {
  console.log('Attempting unsafe run');
  await Promise.all([
    launchWorker(),
    launchWorker(),
  ]);

  console.log('Attempting safe run');
  // The default stack size in Rust WASM is 1MB (0x100000).
  // By assigning distinct stack pointers within this space, we avoid collision.
  // For example, one worker's stack starts at 1MB, the other's at 512KB (0x50000).
  // Each pointer decrements as grows.
  await Promise.all([
    launchWorker(0x100000),
    launchWorker(0x50000),
  ]);
}

runWorkers();