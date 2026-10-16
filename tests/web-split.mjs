/** Scoped build graph parity; no stage traversal or gameplay regression sweep. */
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeEntries} from '../shared/build.mjs';
import {appHarness} from './app-regression-helpers.mjs';

const read=p=>readFile(p,'utf8'),json=async p=>JSON.parse(await read(p));
const manifest=await json('web/manifest.json');
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const record of manifest.files){
 const bytes=await readFile(record.path);
 assert.equal(bytes.length,record.bytes,record.path);
 assert.equal(digest(bytes),record.sha256,record.path);
 assert(record.path.includes(record.sha256.slice(0,16)),record.path);
}
const projectFiles=await json(manifest.project);
const [base,library,stages]=await Promise.all([json(projectFiles.base),json(projectFiles.library),Promise.all(projectFiles.stages.map(json))]);
const reconstructed={...base,library,stages};
const native=await runtimeEntries({vector:false,render:false});
assert.deepEqual(reconstructed,JSON.parse(JSON.stringify(native.find(e=>e.project).project)),'External chapters/library must reproduce the exact native campaign input');
const {App,g,storage,load,profileThrough}=await appHarness();
const app=load(profileThrough(1));
assert.equal(app.screen,'title');
g.HONRO_EMBEDDED=true;
const before=JSON.stringify([...storage]);
const embedded=new App();
embedded.persist();
assert.equal(JSON.stringify([...storage]),before);
assert.equal(embedded.screen,'title');
const workshop=await read('workshop/src/app.js');
assert(workshop.includes('frame.src=new URL(HONRO_PLAYTEST_URL,document.baseURI).href'));
assert(!workshop.includes('frame.srcdoc='));
const report={checks:['All generated hashes and byte counts','Native campaign input equals reconstructed chapters and library','Native Game and embedded Game enter title','Embedded persist preserves campaign storage','Workshop uses direct iframe document'],files:manifest.files.length,stages:stages.length,library:library.length};
await mkdir('_local/reports/web-split',{recursive:true});
await writeFile('_local/reports/web-split/parity.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
