# JavaScript (Node.js) Verify Example

```js
import { LukuSDK } from '@lukuid/sdk';

const sdk = new LukuSDK();
const result = await sdk.verify(fileBuffer);

if (result.valid) {
  console.log(result.manifest);
} else {
  console.error(result.reason);
}
```
