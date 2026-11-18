import fs from 'node:fs';import crypto from 'node:crypto';import assert from 'node:assert/strict';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');const pin=JSON.parse(read('contract.json'));
assert.equal(sha(read('candidate.js')),pin.candidateSHA256);
const reference=read('reference.js');assert.equal(sha(reference.replace('const MAX_TRANSITION_PIXELS=8*1024*1024;','const MAX_TRANSITION_PIXELS=1024*1024;')),pin.baseSHA256);assert(pin.inverseExact);console.log('Pinned candidate and exact single-cap reference');
