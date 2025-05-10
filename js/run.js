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
  // スタックサイズはデフォルトで1MBであるため、それ以下のスタックポインタは問題ない
  await Promise.all([
    launchWorker(0x100000),
    launchWorker(0x50000),
  ]);
}

runWorkers();