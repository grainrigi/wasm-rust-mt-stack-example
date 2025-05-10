const { workerData } = require('worker_threads');

const { wasmBuffer, sharedMemory, stackPointer } = workerData;

const importObject = {
  env: { memory: sharedMemory }
};

WebAssembly.instantiate(wasmBuffer, importObject)
  .then(({ instance }) => {
    if (stackPointer) {
      instance.exports.__stack_pointer.value = stackPointer;
    }
    const result = instance.exports.algorithm();
    console.log("Result: ", result);
  })
  .catch(e => {
    console.error("Wasm instantiation failed:", e);
  });