const crypto = require('crypto');
const certs = require('fs').readFileSync('../../../samples/dotluku/dev/1.0.0/first-passable-verification-sample.luku');
// Actually let's just use the exact python implementation using openssl to see if openssl verifies it.
