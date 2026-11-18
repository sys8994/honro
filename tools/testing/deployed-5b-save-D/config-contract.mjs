import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
const root=process.argv[2]||path.dirname(new URL(import.meta.url).pathname);const cfg=JSON.parse(fs.readFileSync(path.join(root,'config.json'),'utf8'));assert(cfg.ready);assert.equal(cfg.candidateCommit,'3700686f1556b5fbc8f3c4fe93413b957d3650bb');assert.equal(cfg.deployedCommit,'5b2edf0b868a6f4ab656574b036586304eb12808');
function validate(s){for(const [,key]of s.matchAll(/\b(?:cfg|config)\.([A-Za-z_][A-Za-z0-9_]*)/g)){if(key==='json')continue;assert(Object.hasOwn(cfg,key),'Missing config property '+key);}assert(!s.includes('candidateDommit'));}
for(const name of ['fixture.mjs','check.mjs','continue-fixture.mjs','continue-check.mjs']){const s=fs.readFileSync(path.join(root,name),'utf8');validate(s);assert.throws(()=>validate(s.replace(/\bcandidateCommit\b/g,'candidateDommit')),/Missing config property/);}
console.log('PASS exact D/config properties; accidental identifier mutation rejected');
