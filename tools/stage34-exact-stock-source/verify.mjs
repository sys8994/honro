import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {readFile,realpath} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const here=path.dirname(fileURLToPath(import.meta.url));
const H=(x,a='sha256')=>createHash(a).update(x).digest('hex');
const canonical=(x)=>Buffer.from(JSON.stringify(x));
const same=(a,b)=>assert(Buffer.compare(canonical(a),canonical(b))===0,'ordered JSON mismatch');
const clone=structuredClone;
const expected={
  head:'2c4e90ff24d1f5aa5d04f01317caa02f89b8194c',tree:'8d90f1fc6737adb025a5bb092b03462e283297ce',
  worldManifestGit:'276b4d57e66fedcaa41746c3848db23b2cb30e7e',sourceToolGit:'dfa7967e6c0380dba45e9cb8b2c94dddbfc3f491',
  optimizerToolGit:'784e574d21cfa668326215fd16dcc0fb6ffcc832',
  world:{bytes:61499742,sha:'8d2af83fbbe91ce1025bb6555647430dad110678596c9622670f99f2bb759b4b'},
  graph:'12b99fa8b1b35c4ed94962c370ff38c6a06597473dc4417b2861ad46d04e0dbc',
  gameEntry:'web/entries/game.df8a4c7f1873e38c.js',
  campaign:'web/data/campaign.7140da5d3649e4ab.json',campaignLoader:'web/runtime/campaign.926544619e01a04a.js',
  sourcePathReceiptsSHA:'0b896f68d8ee2d81cfa41c8ff43903e624e17327993ab59319627694fec23d67',
  map:'web/data/chapter-34.cb39c6d6adc3cef6.json',
  packet:'web/data/chapter-34-assets.3828bd02ec5b054c.json',
  cmpManifestSHA:'04a7b33b6b7f2a193e96b86ad8c579a43410357d40fd57607923162ff0b664fe'
};
const R=await readFile(path.join(here,'SOURCE-PROOF.json')); assert.equal(H(R),expected.cmpManifestSHA);
const pins=JSON.parse(R);
const mapstart=Buffer.from('{"id":"stage-34"');
const mapend=Buffer.from(',{"id":"stage-35"');
const cut=Buffer.from(',{"id":"approved34-east-v6-connected"');
const rawmapsha=pins.rawMap.stockWithoutLF[1],mapsha=pins.rawMap.stockWithLF[1];
const exactFile=(b,bytes,sha)=>{assert.equal(b.length,bytes);assert.equal(H(b),sha);return b;};
const gitBlob=(b)=>H(Buffer.concat([Buffer.from('blob '+b.length+'\x00'),b]),'sha1');
function gitRun(r,...args){return execFileSync('git',['-C',r,...args],{env:{...process.env,GIT_OPTIONAL_LOCKS:'0'},encoding:'utf8'}).trim();}
const newId='scratch-qa-only:stage34:inverse-sentinel';
const left='approved34-lower-natural-mask-v2',right='approved34-east-v6-connected';
const stageOf=(w)=>{const ss=w.stages.filter(x=>x.id==='stage-34');assert.equal(ss.length,1);return ss[0];};
const oneIndex=(t,needle)=>{const i=t.indexOf(needle);assert(i>=0,'marker missing');assert.equal(t.indexOf(needle,i+1),-1,'marker not unique');return i;};
function rawMap(w,{exactWorld=false}={}){
  const begin=oneIndex(w,mapstart),end=oneIndex(w,mapend);assert(end>begin);
  const b=w.subarray(begin,end);exactFile(b,27265,rawmapsha);
  const local=oneIndex(b,cut);assert.equal(local,10796);
  const s=JSON.parse(b);assert.equal(s.elements[4].id,left);assert.equal(s.elements[5].id,right);
  if(exactWorld){assert.equal(begin,87041);assert.equal(begin+local,97837);assert(w.subarray(-2).equals(Buffer.from(']}')));}
  return {b,mapOffset:begin,between:begin+local,stage:s};
}
function roleSkeleton(a){
 const obj=clone(a);const paths={};
 function go(x,p=[]){
   if(!x||typeof x!=='object')return;
   if(x.tag==='path')for(const k of ['d','dParts'])if(Object.hasOwn(x,k)){
     const d=canonical(x[k]);paths[JSON.stringify(p.concat(k))]=[d.length,H(d)];x[k]='STAGE34-D';
   }
   if(Array.isArray(x))x.forEach((a,i)=>go(a,p.concat(i)));else for(const [k,v]of Object.entries(x))go(v,p.concat(k));
 }
 go(obj);
 return {other:[canonical(obj).length,H(canonical(obj))],paths};
}
function difference(raw,current){
 const report={};
 const rawIDs=Object.keys(raw),packIDs=current.map(a=>a.id);
 same(rawIDs,packIDs);
 for(const v of current){
   const a=raw[v.id],b=roleSkeleton(v);
   assert.equal(a.other[1],b.other[1],v.id+' non-path source metadata drift');
   same(Object.keys(a.paths),Object.keys(b.paths));
   const delta=[];
   for(const k of Object.keys(a.paths)){const pre=a.paths[k],post=b.paths[k];if(pre[1]!==post[1])delta.push({node:JSON.parse(k),serializedSourceBytes:pre[0],serializedPublishedBytes:post[0],sourceSHA256:pre[1],publishedSHA256:post[1]});}
   report[v.id]={registeredPathCount:Object.keys(b.paths).length,nonPathFieldsExact:true,changedPathValues:delta};
 }
 const actual=Object.entries(report).filter(([,v])=>v.changedPathValues.length).map(([k])=>k);
 same(actual,['approved34:body','approved34:lower-continuation-v2','approved34:east-v6-connected-diagnostic']);
 return report;
}
function packetIdentity(bp) {
  exactFile(bp,4084146,pins.currentPublishedPacket.sha);
  const q=JSON.parse(bp);
  same(q.map(x=>[x.id,canonical(x).length,H(canonical(x)),H(canonical(x.vector))]),pins.currentPublishedPacket.entries);
  return q;
}
async function sourceReceipts(){const bytes=await readFile(path.join(here,'RAW-PATH-RECEIPTS.json')); assert.equal(H(bytes),expected.sourcePathReceiptsSHA); return JSON.parse(bytes);}
function publishedCore(mbytes,cbytes,mapbytes,packetbytes){
 exactFile(mbytes,6966363,expected.graph);
 const web=JSON.parse(mbytes),rows=new Map(web.files.map(x=>[x.path,x]));
 function verify(name,b){const e=rows.get(name);assert(e&&typeof e.sha256==='string');return exactFile(b,e.bytes,e.sha256);}
 const campaign=JSON.parse(verify(expected.campaign,cbytes));
 assert.equal(web.gameEntry,expected.gameEntry);
 const entry=(web.common||[]).filter(p=>/^web\/runtime\/campaign\./.test(p));
 same(entry,[expected.campaignLoader]);assert(rows.has(entry[0])&&rows.has(web.gameEntry));
 assert.equal(campaign.stages[33],expected.map);assert.equal(campaign.stageLibraries[33],expected.packet);
 assert.equal(campaign.assetEncodings.stageLibraries[33],'json');same(campaign.assetPaths.stages[33],[]);same(campaign.assetPaths.stageLibraries[33],[]);
 exactFile(verify(expected.map,mapbytes),27266,mapsha);
 const pack=packetIdentity(verify(expected.packet,packetbytes));
 return {web,rows,campaign,pack,entry:entry[0],record:{manifest:expected.graph,campaign:H(cbytes),stageIndex:33,stageMap:mapsha,stagePacket:pins.currentPublishedPacket.sha,graphLoader:entry[0],knownCompat34:campaign.compatibility34??null}};
}
async function archivedProduct(mp,cp,dir){
 const b=await publishedCore(await readFile(mp),await readFile(cp),await readFile(path.join(dir,'stage.json')),await readFile(path.join(dir,'packet.json')));
 return {status:'PASS_ARCHIVED_PINNED_MANIFEST_CAMPAIGN_MAP_AND_PACKET_READBACK_ONLY',product:b.record,
 activeEntryAndLoaderBytes:'NOT_READ_IN_ARCHIVED_MODE; stock mode checks actual module text separately',
 exactCanonicalStockSource:'NOT_RUN_IN_ARCHIVED_MODE',noNewBuild:true};
}
function patchSentinel(world){
 const a=rawMap(world),orig=JSON.parse(world),end=world.length-2;
 assert(!world.includes(Buffer.from(newId)));
 assert(world.subarray(end).equals(Buffer.from(']}'))); assert(orig.library.length>=1);
 // Two format-test records, not canonical artwork, shape geometry or an executable build arm.
 const e={id:newId,assetId:newId,__scratchOnlySentinel:'map element',note:'UTF-8 원본 검증'};
 const b={id:newId,__scratchOnlySentinel:'library entry',note:'UTF-8 되돌림'};
 const changes=[{begin:a.between,part:Buffer.from(','+canonical(e))},{begin:end,part:Buffer.from(','+canonical(b))}];
 assert(changes[0].begin<changes[1].begin);
 const bytes=Buffer.concat([world.subarray(0,changes[0].begin),changes[0].part,world.subarray(changes[0].begin,changes[1].begin),changes[1].part,world.subarray(changes[1].begin)]);
 const srcReverted=clone(JSON.parse(bytes)),target=stageOf(srcReverted);
 same(target.elements[5],e); same(srcReverted.library.at(-1),b);
 assert.equal(srcReverted.stages.filter(s=>s.elements.some(e=>e.id===newId)).length,1);
 const p=target.elements.splice(5,1)[0],q=srcReverted.library.pop(); same(p,e);same(q,b);same(srcReverted,orig);
 return {bytes,changes,semanticExact:true,includesNoArt:true};
}
function unpatchExact(mut,changes,original,beforeSHA){
 let delta=0; const old=[];let at=0;
 for (const {begin,part} of changes){
   const shifted=begin+delta;
   assert(mut.subarray(shifted,shifted+part.length).equals(part),'inserted bytes or locator drift');
   old.push(mut.subarray(at,shifted));at=shifted+part.length;delta+=part.length;
 }
 old.push(mut.subarray(at));
 const z=Buffer.concat(old);
 assert(z.equals(original),'out-of-scope source mutation');
 assert.equal(H(z),beforeSHA);
 return z;
}
async function synthetic(dir){
 const pub=exactFile(await readFile(path.join(dir,'stage.json')),27266,mapsha);
 assert(pub.subarray(-1).equals(Buffer.from('\n')));
 const before=Buffer.concat([Buffer.from('{"revision":1,"stages":[', 'utf8'),pub.subarray(0,-1),
   Buffer.from(',{"id":"stage-35","elements":[{"id":"목표","assetId":"기존"}]}],"library":[{"id":"기존","sentinel":"비교용"}]}')]);
 const a=patchSentinel(before),back=unpatchExact(a.bytes,a.changes,before,H(before));
 // Negative controls are in-memory byte/semantic tampering of the tiny synthetic fixture only.
 const controls=[];
 {
   const tamper=Buffer.from(a.bytes);tamper[a.changes[0].begin+4]^=1;
   assert.throws(()=>unpatchExact(tamper,a.changes,before,H(before)),/inserted bytes/);controls.push('insertion-byte-drift rejects');
 }
 {
   const tamper=Buffer.from(a.bytes);tamper[13]^=1;
   assert.throws(()=>unpatchExact(tamper,a.changes,before,H(before)),/out-of-scope source/);controls.push('outside byte drift rejects');
 }
 {
   const wrong=a.changes.map(x=>({...x}));wrong[1].begin-=2;
   assert.throws(()=>unpatchExact(a.bytes,wrong,before,H(before)),/inserted bytes/);controls.push('wrong library append coordinate rejects');
 }
 {
   const dup=Buffer.from(before.toString().replace('"기존","sentinel"',JSON.stringify(newId)+',"sentinel"'));
   assert.throws(()=>patchSentinel(dup));controls.push('collision/duplicate reserved ID rejects');
 }
 {
   const invalid=Buffer.from(before.toString().replace(right,right+'-wrong'));
   assert.throws(()=>patchSentinel(invalid));controls.push('stale exact Stage34 map/anchor rejects');
 }
 const actualPacket=packetIdentity(await readFile(path.join(dir,'packet.json')));
 const receipts=await sourceReceipts();
 const pathsReport=difference(receipts,actualPacket);
 return {status:'PASS_SYNTHETIC_IN_MEMORY_ONLY_WITH_EXACT_ARCHIVED_MAP_AND_PACKET_COMPARISON',
   synthetic:{sourceBytes:before.length,sourceSHA256:H(before),restoredSHA256:H(back),addedRecords:a.changes.map(x=>({insertionByte:x.begin,bytes:x.part.length,sha256:H(x.part)})),semanticExact:a.semanticExact,negativeControls:controls,emittedWorldBytes:false},
   archivedSourcePathCompare:pathsReport, canonicalExactCheckoutStock:'NOT_RUN_LOCAL_EXACT_CHECKOUT_UNAVAILABLE', canonicalPublishedGraphReadback:'NOT_RUN_IN_SYNTHETIC_MODE',
   exactOptimizerLedgerApplication:'NOT_RUN_IN_SYNTHETIC_MODE', doesNotProve:['Stage34 source append format accepted by game','native element neutral draw','total generated A/A0 closure','live release or optimization']};
}
async function fileFrom(root,name){return readFile(path.join(root,name));}
async function lockedModule(root,name,sha){const p=path.join(root,name);const b=await readFile(p);assert.equal(gitBlob(b),sha,'dirty canonical module: '+name);return import(pathToFileURL(p));}
async function stock(root){
 root=await realpath(root);
 assert.equal(gitRun(root,'rev-parse','--verify','HEAD'),expected.head);
 assert.equal(gitRun(root,'rev-parse','HEAD^{tree}'),expected.tree);
 const src=JSON.parse(await fileFrom(root,'shared/data/act4/world.parts/manifest.json'));
 const manbytes=await fileFrom(root,'shared/data/act4/world.parts/manifest.json');
 assert.equal(gitBlob(manbytes),expected.worldManifestGit);
 assert.equal(src.parts.length,30);assert(src.parts.slice(0,29).every(p=>p.bytes===2097152));assert.equal(src.parts[29].bytes,682334);
 const mod=await lockedModule(root,'tools/act4-source/world-source.mjs',expected.sourceToolGit);
 // This API reads/verifies only. Never invoke materializeWorld, packWorld, buildWeb, or git status.
 const w=await mod.readWorldSource(path.join(root,'shared/data/act4'));
 exactFile(w.bytes,expected.world.bytes,expected.world.sha);same(w.manifest,src);
 const a=rawMap(w.bytes,{exactWorld:true}),ow=JSON.parse(w.bytes),raw=stageOf(ow);
 same(a.stage,raw);
 const srcassets=pins.currentPublishedPacket.entries.map(([id])=>{
   const r=ow.library.filter(v=>v.id===id);assert.equal(r.length,1);const o=r[0],p=pins.sourceAssets[id];
   exactFile(canonical(o),p.normalizedBytes,p.normalizedSHA256);
   assert.equal(H(canonical(o.vector)),p.vectorSHA256);
   return o;
 });
 const srcView=Object.fromEntries(srcassets.map(o=>[o.id,roleSkeleton(o)]));
 for(const [id,s]of Object.entries(await sourceReceipts())){assert.equal(s.other[1],srcView[id].other[1]);same(s.paths,srcView[id].paths);}
 // Independent source-result stage equality: compiled output is read from the verified pinned published graph, not synthesized.
 const stockMap=await fileFrom(root,expected.map);
 const pkg=publishedCore(await fileFrom(root,'web/manifest.json'),await fileFrom(root,expected.campaign),stockMap,await fileFrom(root,expected.packet));
 const fromActive=async name=>{const e=pkg.rows.get(name);assert(e&&typeof e.sha256==='string');return exactFile(await fileFrom(root,name),e.bytes,e.sha256);};
 const game=await fromActive(pkg.web.gameEntry), code=await fromActive(pkg.entry);
 assert(code.toString().includes(expected.campaign),'active campaign loader does not select expected graph');
 assert(game.toString().includes(path.basename(pkg.entry)),'active game entry has wrong campaign entry');
 assert(stockMap.equals(Buffer.concat([a.b,Buffer.from('\n')])));
 const report=difference(srcView,pkg.pack);
 return {status:'PASS_EXACT_CHECKOUT_STOCK_SOURCE_AND_CURRENT_PUBLISHED_PACKET_NOT_NORMAL_REBUILD',
   canonicalReader:{sha256:expected.world.sha,bytes:w.bytes.length,parts:src.parts.length,stageMapOffset:a.mapOffset,nextRegistrationOffset:a.between,terminalLibraryAppendOffset:w.bytes.length-2,matchedSourceAssets:srcassets.length},
   product:{...pkg.record,activeEntryAndLoaderBytes:'manifest SHA verified and static references checked'},
   sourceVsPackaged:report,
   exactOptimizerLedgerApplication:'NOT_RUN; source-vs-packaged path comparison is exact, but no full canonical build/ledger evaluation or new registration has been run',
   doesNotProve:['full normal stock rebuild dependency closure','A0 source registration or A/A0 actual neutral rendering','live deployment or performance']};
}
const [mode,where,...extra]=process.argv.slice(2);
try{
 assert(['--synthetic','--stock','--archived-product'].includes(mode),'Usage: node verify.mjs (--synthetic archive-dir | --stock exact-checkout | --archived-product manifest campaign archive-dir)');
 assert(typeof where==='string'&&where.length);
 assert.equal(extra.length,mode==='--archived-product'?2:0);
 const result=mode==='--stock'?await stock(where):mode==='--synthetic'?await synthetic(where):await archivedProduct(where,...extra);
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(JSON.stringify({status:'HOLD_VERIFIER_OR_AUTHORITY',mode,message:e.message},null,2));process.exitCode=2;}
