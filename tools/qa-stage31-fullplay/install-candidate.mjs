// QA-only: invoke from a disposable copy located under /tmp, never a checkout.
import {realpath,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {packWorld} from '../act4-source/world-source.mjs';
const cwd=await realpath(process.cwd());
if(!cwd.startsWith('/tmp/')||!process.argv[2])throw Error('Usage from a disposable /tmp QA copy: node tools/qa-stage31-fullplay/install-candidate.mjs CANDIDATE');
const raw=await readFile(process.argv[2]),sha=createHash('sha256').update(raw).digest('hex');
if(sha!=='540e65d68ab2049ea0271fa168c78b1024b598703ec9e63bcf7fc19c9e67ccc1')throw Error('Unexpected candidate SHA');
const c=JSON.parse(raw),w=JSON.parse(await readFile('shared/data/act4/world.json','utf8'));
const stage=c.stages.find(s=>s.metadata?.stageId===31),i=w.stages.findIndex(s=>s.metadata?.stageId===31);
if(!stage||i<0||c.stages.length!==1)throw Error('Invalid candidate stage');
w.stages[i]=stage;for(const a of c.library){const j=w.library.findIndex(x=>x.id===a.id);if(j<0)w.library.push(a);else w.library[j]=a;}
await writeFile('shared/data/act4/world.json',JSON.stringify(w));await packWorld();await writeFile('candidate.json',raw);
console.log(JSON.stringify({candidateSha256:sha,stage:stage.id,assets:c.library.length,scope:'disposable QA build input only'}));
