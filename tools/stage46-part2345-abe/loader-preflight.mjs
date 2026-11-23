import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
const [w0,pin]=process.argv.slice(2),w=path.resolve(w0),P=JSON.parse(fs.readFileSync(pin)),probe=P.loaderProbe;
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const info=b=>({bytes:b.length,sha256:hash(b),git:crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+b.length+'\0'),b])).digest('hex')});
const read=(dir,f)=>{const p=path.resolve(dir,f),r=fs.realpathSync(p);assert.ok(r.startsWith(path.resolve(dir)+path.sep));return fs.readFileSync(r);};
const FNV=s=>{let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return s.length+':'+(n>>>0).toString(16);};
const bodyFixturePath=Object.assign({},probe.negativeCampaign);delete bodyFixturePath.path;
const previous=path.join(w,'E');
const priorC=JSON.parse(read(previous,P.packs.E.campaign));
assert.equal(priorC.assetEncodings.stageLibraries[45],'json-pool-v1');
priorC.assetEncodings.stageLibraries[45]='json';
const neg=Buffer.from(JSON.stringify(priorC)+'\n');
assert.deepEqual(info(neg),bodyFixturePath,'R1 negative should be the same actual R1 campaign bytes');
const loaderBytes=read(previous,probe.loader);
assert.deepEqual(info(loaderBytes),probe.deps[probe.loader]);
const result={method:'Exact pinned load-data module, real B/E campaign/base/shared/Stage46 map/chunks via read-only local Fetch Response adapter; no app authors, browser, account or storage',loader:info(loaderBytes),actualBrowser:false,noProduct:true,proof:{}};
const oldFetch=globalThis.fetch;
const priorContent=globalThis.HONRO_CONTENT;
globalThis.HONRO_CONTENT={stages:[{id:46}]}; // deterministic boot hint only; no profile
result.bootSelection='in-memory HONRO_CONTENT destination metadata for Stage46; original manifest remains intact';
async function run(mode){
 const arm=mode==='B'?'B':'E', src=path.join(w,arm), pack=P.packs[arm],descriptor=JSON.parse(read(src,pack.descriptor));
 const fixtureRoot=path.join(w,'loader-probe',mode), r=path.join(fixtureRoot,'web/runtime/load-data-pin.mjs');
 fs.mkdirSync(path.dirname(r),{recursive:true});fs.writeFileSync(r,loaderBytes);
 const f=mode==='negativeR1'?probe.negativeCampaign.path:pack.campaign;
 const inputs=new Map([[f,mode==='negativeR1'?neg:read(src,f)],[probe.base,read(src,probe.base)],[probe.shared,read(src,probe.shared)],[P.map,read(src,P.map)],[pack.descriptor,read(src,pack.descriptor)],...descriptor.parts.map(q=>[q.path,read(src,q.path)])]);
 for(const q of descriptor.parts)assert.equal(hash(inputs.get(q.path)),q.sha256);
 for(const q of [probe.base,probe.shared])assert.deepEqual(info(inputs.get(q)),probe.deps[q]);
 assert.equal(hash(inputs.get(P.map)),P.expectedActiveAB.B.files[P.map].sha256);
 const hits=[],attempted=new Set;
 globalThis.fetch=async function(input,op){
  const u=new URL(input),p=fileURLToPath(u);
  assert.ok(p.startsWith(fixtureRoot+path.sep),'loader resolved outside pinned diagnostic root');
  const k=path.relative(fixtureRoot,p).split(path.sep).join('/');attempted.add(k);
  assert.ok(inputs.has(k),'loader requested unexpected dependency: '+k);
  const b=inputs.get(k);hits.push({path:k,bytes:b.length,sha256:hash(b)});
  return new Response(b,{status:200,headers:{'content-length':String(b.length),'content-type':k.endsWith('.json')?'application/json':'application/octet-stream'}});
 };
 const M=await import(pathToFileURL(r).href);
 if(mode==='negativeR1'){
  await assert.rejects(()=>M.loadCampaign(f,[]),e=>e.name==='TypeError'&&e.message==='parts[1] is not iterable','R1 cause must reproduce with original exact defective campaign');
  assert.deepEqual(attempted,new Set(inputs.keys()));
  return {status:'EXPECTED_REJECT',error:'parts[1] is not iterable',campaign:info(neg),network:hits};
 }
 const campaign=await M.loadCampaign(f,[]);
 assert.equal(globalThis.HonroCampaignLoader.has(46),true);
 const map=await globalThis.HonroCampaignLoader.ensureStage(46);assert.equal(map.metadata.stageId,46);assert.equal(map.id,'stage-46');
 const providers=campaign.library.filter(k=>k.id==='act5:near:46');
 assert.equal(providers.length,1);const a=providers[0];
 assert.equal(a.shaftExteriorParts.length,5);assert.equal(a.collision.length,0);
 const sig=FNV(JSON.stringify(a));assert.equal(sig,arm==='B'?P.newSig:P.Esignature);
 assert.deepEqual(attempted,new Set(inputs.keys()));
 return {status:'PASS_EXACT_LOADCAMPAIGN_ENSURESTAGE',mapId:map.id,checkedProvider:sig,network:hits};
}
try{for(const arm of ['negativeR1','B','E'])result.proof[arm]=await run(arm);}
finally{globalThis.fetch=oldFetch;globalThis.HONRO_CONTENT=priorContent;delete globalThis.HonroCampaignLoader;}
fs.writeFileSync(path.join(w,'out','E-PINNED-LOADER-PREFLIGHT.json'),JSON.stringify(result,null,2)+'\n');
