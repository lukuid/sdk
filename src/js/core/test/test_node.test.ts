import { LukuFile } from '../src/index.js';
import { readFileSync } from 'fs';

const envelope = JSON.parse(readFileSync('../../../samples/envelopes/dev/1.0.0/valid_envelope.json', 'utf8'));

LukuFile.verifyEnvelope(envelope, { 
    allowUntrustedRoots: false,
    skipCertificateTemporalChecks: true,
    trustProfile: 'dev'
}).then(issues => console.log('ISSUES:', issues));
