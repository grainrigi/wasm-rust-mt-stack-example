# Rust WASM Multithreaded Stack Collision Example

## Update (2025-05-11):

The phenomenon explained below will not occur if you are using [wasm-bindgen](https://github.com/rustwasm/wasm-bindgen).
This is because [wasm-bindgen/threads-xform injects certain logic into the __wbindgen_start](https://github.com/rustwasm/wasm-bindgen/blob/c35cc9369d5e0dc418986f7811a0dd702fb33ef9/crates/threads-xform/src/lib.rs#L286-L323) which allocates a dedicated stack for each additionally launched thread. (The first thread uses the default stack pointer.)
Therefore, it is recommended to launch your WASM module using the `init` (or `initSync`) function provided by `wasm-bindgen`.

## Overview

In Rust, even when built with atomics (shared-memory) enabled, the value of `$__stack_pointer` defaults to the same as the stack-size. Since this is initialized by a constant, it's possible for the same region of stack memory to be read and written simultaneously across multiple WASM instances.

This sample demonstrates the phenomenon where stacks corrupt each other when running the binary concurrently with no countermeasures taken.

## How to Run

To build with shared-memory enabled, thr Rust nighly toolchain and `rust-src` component are required to run this example.
These can be installed by:

```sh
rustup install nightly
rustup component add rust-src --toolchain nightly
```

Now you can run the example as follows:

```sh
cargo +nightly build --release
node js/run.js
```

The following deterministic logic will run concurrently. The correct answer is `5172326400000`.

```rs
pub extern "C" fn algorithm() -> i64 {
    let mut work = [0 as i32; 1024];
    let mut sum: i64 = 0;

    for i in 0..1024 {
        work[i] = i as i32;
    }

    for _ in 0..100000 {
        for i in 0..1024 {
            sum += work[i] as i64;
        }
        for i in 0..1024 {
            work[i] = work[i] + 1;
        }
    }

    sum
}
```

This will produce results as follows:

```
Attempting unsafe run
Result:  8990846950827n
Result:  10809871977149n
Attempting safe run
Result:  5172326400000n
Result:  5172326400000n
```

In the unsafe run, no countermeasures are taken. This causes the two threads to corrupt each other's local `work` variable, making the result unpredictable.

## Countermeasure

In the subsequent safe run, the values are calculated correctly. This is because `__stack_pointer` was set to a different value for each instance.

To change `__stack_pointer`, it first needs to be exported.
Add the following linker flags to `.cargo/config.toml`:

```toml
rustflags = [
  "-C", "target-feature=+atomics,+bulk-memory",
  "-C", "link-args=--export=__stack_pointer",
]
```

Thanks to the Mutable Global Imported/Exported proposal, the exported `__stack_pointer` can be directly modified on the JavaScript side.

```javascript
  instance.exports.__stack_pointer.value = stackPointer;
```

Note that an exported global becomes a `WebAssembly.Global` object rather than a primitive value, so it needs to be modified through the `.value` property.