# Rust Verify Example

```rust
use lukuid_sdk::LukuSDK;

fn main() {
    let sdk = LukuSDK::new();
    let result = sdk.verify(&file_buffer);

    match result.valid {
        true => println!("{:?}", result.manifest),
        false => eprintln!("{:?}", result.reason),
    }
}
```
