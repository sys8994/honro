import assert from 'node:assert/strict';import fs from 'node:fs';import{createHash}from'node:crypto';
const m=JSON.parse(fs.readFileSync('tests/fixtures/terrain-monster-preflight.json'));
const gitBlob=b=>createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
for(const f of m.copied)assert.equal(gitBlob(fs.readFileSync(f.path)),f.sha,f.path+' copied exactly');
const build=fs.readFileSync('shared/build.mjs','utf8');
for(const id of ['stage33-exterior-art','stage34-foundation-edge','stage37-alpha-edge','stage38-alpha-edge','early-encounter-placement','HonroEarlyEncounterPlacement'])assert.equal(build.split("'"+id+"'").length-1,1,id+' registered once');
assert(!build.includes("'stage32-foundation-art'"),'stage32 excluded');
console.log(JSON.stringify({passed:true,exactCopiedFiles:m.copied.length,limits:m.purpose}));
