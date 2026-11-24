// Held-out normal compiler input/emit guard. Never mutate a stock manifest or
// install these fixtures in a product. Authorization comes from the caller.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {IDS, party} from './transition-contract.mjs';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex'), same=(a,b,msg)=>assert.deepEqual(a,b,msg);
const safe=s=>typeof s==='string'&&/^web\/(?:[\w-]+\/)*[\w.-]+$/.test(s)&&!s.includes('..');
const rows=m=>[m.stages,m.stageLibraries,m.catalog,m.assetPaths.stages,m.assetPaths.stageLibraries,m.assetEncodings.stageLibraries];
const checked=(e,read)=>{
 assert(safe(e?.path)&&Number.isSafeInteger(e.bytes)&&e.bytes>0&&/^[a-f\d]{64}$/.test(e.sha256??''),'invalid pinned child file');
 const bytes=read(e.path);
 assert(Buffer.isBuffer(bytes)&&bytes.length===e.bytes&&sha(bytes)===e.sha256,'missing or changed '+e.path);
 const suffix=/\.([0-9a-f]{16})\.[A-Za-z0-9]+$/.exec(e.path);
 assert(suffix&&e.sha256.startsWith(suffix[1]),'non-addressed '+e.path);
 return bytes;
};
const exact=(bytes,digest)=>{assert.equal(sha(bytes),digest,'stock root manifest identity');return JSON.parse(bytes);};
const stdId=(id,row)=>id===row?.id&&row?.act===6&&row?.actStage===id-50;
function refsOf(o,set=new Set()){
 if(Array.isArray(o))for(const v of o)refsOf(v,set);
 else if(o&&typeof o==='object'){if(Object.hasOwn(o,'$honroAsset')){assert(safe(o.$honroAsset));set.add(o.$honroAsset);}for(const v of Object.values(o))refsOf(v,set);}
 return set;
}

export function admitCatalog({enabled=false,baseBytes,baseSHA256,stages,read,decodeAssets,sharedAssetIds=[]}){
 if(enabled!==true)return {admitted:false,manifestBytes:baseBytes,reason:'disabled'};
 try{
  const a=exact(baseBytes,baseSHA256);
  same(rows(a).map(ar=>ar.length),[50,50,50,50,50,50]);
  same(a.catalog.map(r=>r.metadata.stageId),Array.from({length:50},(_,i)=>i+1),'stock IDs');
  same(a.catalog.map(r=>r.id),Array.from({length:50},(_,i)=>'stage-'+(i+1)),'stock authored IDs');
  assert(Array.isArray(stages)&&stages.length===10,'all 10 signed stage rows required');
  const ids=new Set(a.libraryOrder), shared=new Set(sharedAssetIds), allReads=new Map();
  const load=pin=>{
    const bytes=checked(pin,read);
    const prior=allReads.get(pin.path);
    if(prior)assert.equal(prior,pin.sha256,'same path must have one identity');
    allReads.set(pin.path,pin.sha256);return bytes;
  };
  const b=structuredClone(a);
  for(const [i,x] of stages.entries()){
   const id=IDS[i], tag='chapter-'+id;
   assert.equal(x?.id,id,'catalog order');
   assert(stdId(id,x.content)&&stdId(id,x.balance),'runtime content/balance ID mismatch');
   same(x.content.requires,[id-1],'predecessor mismatch');
   same(x.content.playableRoster,party(id),'content roster mismatch');
   assert(x.journey?.stageId===id&&typeof x.journey?.anchorId==='string'&&x.journey.anchorId,'missing journey node');
   assert.equal(x.map?.path,'web/data/'+tag+'.'+x.map?.sha256?.slice(0,16)+'.json');
   assert(x.assets?.path.startsWith('web/data/'+tag+'-assets.'),'wrong provider name');
   const m=JSON.parse(load(x.map));
   assert.equal(m.id,'stage-'+id);
   same([m.metadata?.stageId,m.metadata?.act,m.metadata?.actStage,m.metadata?.campaign],[id,6,i+1,true]);
   same([m.name,m.width,m.height,m.backdrop],[x.content.name,x.content.w,x.content.h,x.catalogBackdrop]);
   assert(m.width>0&&m.height>0&&Array.isArray(m.terrains)&&m.terrains.length&&Array.isArray(m.units));
   const player=m.units.filter(u=>u.team==='player');
   same(player.map(u=>u.kind),party(id),'actual map players differ from roster');
   // HonroUnits.create assigns stageOverrides after the real team/ID defaults.
   for(const u of m.units){
    for(const key of ['id','cls','side','summoned','honroAlly','honroCivilian'])
     assert(!Object.hasOwn(u.stageOverrides??{},key),'role/identity override '+key);
    if(u.team==='player')assert(!u.runtimeTemplate&&!('levelOverride' in u),'player must resolve from actual profile');
   }
   assert(m.units.every(u=>typeof u.id==='string'&&u.id), 'missing actor ID');
   same(new Set(m.units.map(u=>u.id)).size,m.units.length,'duplicate actor ID');
   const encoding=x.assets.encoding??'json';
   const packet=JSON.parse(load(x.assets));
   const providers=encoding==='json'?packet:encoding==='json-pool-v1'&&decodeAssets?decodeAssets(packet):null;
   assert(Array.isArray(providers)&&providers.length,'no decoded chapter provider packet');
   const local=new Set();
   for(const a6 of providers){assert(typeof a6.id==='string'&&a6.id.startsWith('act6:'),'invalid Act6 provider ID');
     assert(!ids.has(a6.id),'duplicate/legacy provider override '+a6.id); ids.add(a6.id);local.add(a6.id); b.libraryOrder.push(a6.id);}
   for(const e of [...(m.elements??[]),...(m.environment?.placements??[])]){
    assert(local.has(e.assetId)||shared.has(e.assetId),'unavailable placement '+e.assetId);
   }
   const mapRefs=[...refsOf(m)].sort(), assetRefs=[...refsOf(providers)].sort();
   const expected=[...new Set([...mapRefs,...assetRefs])].sort(), declared=(x.media??[]).map(v=>v.path).sort();
   same(declared,expected,'missing/extra signed chapter media');for(const pin of x.media??[])load(pin);
   b.stages.push(x.map.path); b.stageLibraries.push(x.assets.path); b.assetEncodings.stageLibraries.push(encoding);
   b.assetPaths.stages.push(mapRefs); b.assetPaths.stageLibraries.push(assetRefs);
   b.catalog.push({id:m.id,name:m.name,width:m.width,height:m.height,backdrop:m.backdrop,metadata:m.metadata,playerRoster:player.map(u=>u.kind),pending:true});
  }
  const newKeys=new Set(a.libraryOrder);
  same(b.libraryOrder.filter(k=>newKeys.has(k)),a.libraryOrder,'legacy library order');
  for(const [i,prefix] of rows(a).entries())same(rows(b)[i].slice(0,50),prefix,'legacy chapter role displaced');
  // The emitted JSON shape is a staging plan for comparison; normal npm build
  // remains authority for output aliases and exact dependency closure.
  return {admitted:true,manifest:b,reads:[...allReads],prefixSHA256:baseSHA256};
 }catch(e){return {admitted:false,manifestBytes:baseBytes,reason:e.message};}
}

export function verifyCompiledPrefix(baseBytes,baseSHA256,emittedBytes){
 const a=exact(baseBytes,baseSHA256),b=JSON.parse(emittedBytes);
 same(rows(a).map(x=>x.length),[50,50,50,50,50,50]);
 same(rows(b).map(x=>x.length),[60,60,60,60,60,60]);
 for(const [i,prefix] of rows(a).entries())same(rows(b)[i].slice(0,50),prefix,'legacy chapter role displaced');
 same(b.libraryOrder.slice(0,a.libraryOrder.length),a.libraryOrder);
 for(const key of ['base','shared','editorExtras','unitTemplates','compatibility32','compatibility33','compatibility34']){
  same(key==='unitTemplates'?b[key].slice(0,a[key].length):b[key],a[key],key);
  if(key!=='unitTemplates'){same(b.assetPaths[key],a.assetPaths[key],key+' media refs');same(b.assetEncodings[key],a.assetEncodings[key],key+' encoding');}
 }
 same(b.catalog.slice(50).map(r=>r.metadata.stageId),IDS,'new stage IDs');
 return true;
}
