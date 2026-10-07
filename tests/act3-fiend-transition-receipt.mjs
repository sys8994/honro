// Historical one-time transition audit, deliberately not the current-art test.
// Supply the campaign.json snapshot from the original fiend transition.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
assert(process.argv[2],'Usage: node tests/act3-fiend-transition-receipt.mjs <historical-campaign.json>');
const p=JSON.parse(await readFile(process.argv[2],'utf8')),receipt=JSON.parse(await readFile('tests/fixtures/historical/act3-fiend-transition-f2e9781.json','utf8')),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),{stages,...header}=p;
assert.equal(hash(header),receipt.headerSha256);assert.equal(stages.length,30);let replaced=0;
for(const s of stages){for(const u of s.units)if(u.kind==='possessedGuard'||u.kind==='possessedArcher'){assert(s.metadata.stageId>=21&&u.team==='enemy');u.kind=u.kind==='possessedGuard'?'recoveryGuard':'recoveryArcher';replaced++;}assert.equal(hash(s),receipt.stages.find(q=>q.id===s.metadata.stageId).sha256,'historical stage '+s.metadata.stageId);}
assert.equal(replaced,38);console.log('PASS historical full-project fiend transition receipt; not a current architecture/geometry constraint');
