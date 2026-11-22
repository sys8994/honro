import {readFileSync as rd,writeFileSync as wr,mkdirSync}from'node:fs';
import {resolve,dirname,join}from'node:path';import {createHash}from'node:crypto';
const [a,b,proof]=process.argv.slice(2).map(x=>resolve(x));
const need=(v,e)=>{if(!v)throw Error(e);},sha=x=>createHash('sha256').update(x).digest('hex');
const gitBlob=x=>createHash('sha1').update(`blob ${Buffer.byteLength(x)}\0`).update(x).digest('hex');
const rows={'approved32:body':'1952606:e60eb3e5','approved32:wood-door-extract':'423282:b2c53b27','act4-handoff:32:body':'843583:aede1464'};
const idArray=JSON.stringify(Object.keys(rows)), sigRows=JSON.stringify(rows), arch='ee7846c92c4edcac5f88771849e89c896a5c6906b0b8c10fb90cdca1d5b1061d';
const pins={'shared/web-build.mjs':'761f6c6a757b3cdb16616ad17195e9d614cc11c3','shared/web-loader.js':'87a9c964211acf9f3f92c69dc31d8c2234d26c72','shared/runtime/profile-store.js':'da6b816f36a786a8e8c4a0e7671b2b77fc9e30e9'};
const stock=p=>{const s=rd(join(a,p),'utf8');need(gitBlob(s)===pins[p],'exact source provider mismatch: '+p);return s;};
function replace(s,base,next){need(s.split(base).length===2,'wrong locked splice: '+base.slice(0,90));return s.replace(base,()=>next); }
const build='shared/web-build.mjs', loader='shared/web-loader.js', profile='shared/runtime/profile-store.js';
const receipt={};
function write(p,old,s){const q=join(b,p);mkdirSync(dirname(q),{recursive:true});wr(q,s);receipt[p]={stockGit:gitBlob(old),afterGit:gitBlob(s),afterSHA256:sha(s),bytes:Buffer.byteLength(s)};}
{
 const old=stock(build);let s=old;
 s=replace(s,"      // Dependency closure includes placements and asset references nested inside assets.",`      // Split only the 3 known Stage 32 historical providers; none may serve any active consumer.
      const stage32=stages.find(s=>s.metadata?.stageId===32),legacy32Ids=${idArray};
      const declared32=stage32?.design?.nativeArt?.compatibilityAssetIds;
      const hasStage32Handoff=stage32?.elements?.some(x=>x.assetId==='act4-handoff:32:body-joined');
      if(hasStage32Handoff)assert.deepEqual(declared32,legacy32Ids,'Stage 32 legacy list changed');
      const compat32=hasStage32Handoff?externalLibrary.filter(a=>legacy32Ids.includes(a.id)):[];
      if(hasStage32Handoff){
        assert.equal(compat32.length,3,'Stage 32 exact legacy archive size changed');
        assert.equal(hash(Buffer.from(JSON.stringify(compat32)+'\\n')),'${arch}','Stage 32 legacy provider bytes changed');
      }
      const ids32=new Set(compat32.map(a=>a.id));
      // Dependency closure includes placements and asset references nested inside assets.`);
 s=replace(s,"if(key!=='id')dependencies(child,found);","if(key!=='id'&&!(ids32.size&&value==='act4-handoff:32:body-joined'&&key==='name'&&child==='act4-handoff:32:body'))dependencies(child,found);");
 s=replace(s,"      const needed=stages.map(stage=>dependencies(stage)),shared=", `      const needed=stages.map(stage=>{
        if(stage!==stage32||!ids32.size)return dependencies(stage);
        // Ignore only the exact declared metadata pointer, never a real art dependency.
        const dependencyView={...stage,design:{...stage.design,nativeArt:{...stage.design.nativeArt,compatibilityAssetIds:[]}}};
        return dependencies(dependencyView);
      });
      assert(needed.every(set=>[...ids32].every(id=>!set.has(id))),'Archived Stage 32 asset has an active chapter consumer');
      const shared=`);
 s=replace(s,"const compatIds=new Set([...compat33,...compat34]","const compatIds=new Set([...compat32,...compat33,...compat34]");
 s=replace(s,"      if(compat33.length){const packet=assetPacket(compat33);",`      if(compat32.length){
        manifest.compatibility32=await json('campaign-compat-32',compat32);
        manifest.assetPaths.compatibility32=assetPaths(compat32);manifest.assetEncodings.compatibility32='json';
      }
      if(compat33.length){const packet=assetPacket(compat33);`);
 write(build,old,s);
}
{
 const old=stock(loader);let s=old;
 s=replace(s,"...(manifest.compatibility33?", "...(manifest.compatibility32?[[manifest.compatibility32,refs?.compatibility32,enc?.compatibility32]]:[]),...(manifest.compatibility33?");
 s=replace(s," let compatibility33Loaded=false", " let compatibility32Loaded=false,compatibility32Loading=null;\n const needs32=b=>!!globalThis.HonroProfileStore?.needsLegacy32Art(b);\n let compatibility33Loaded=false");
 s=replace(s,"return (!needs33(b)||compatibility33Loaded)&&(!needs34(b)||compatibility34Loaded);","return (!needs32(b)||compatibility32Loaded)&&(!needs33(b)||compatibility33Loaded)&&(!needs34(b)||compatibility34Loaded);");
 s=replace(s,"  if(hasBattleArt(b))return;",`  if(hasBattleArt(b))return;
  if(needs32(b)&&!compatibility32Loaded){
   if(compatibility32Loading)return compatibility32Loading;
   compatibility32Loading=(async()=>{
    if(!manifest.compatibility32)throw Error('Missing Stage 32 compatibility art');
    const old=await loadData(manifest.compatibility32,manifest.assetPaths?.compatibility32,assetOptions(manifest.assetEncodings?.compatibility32));
    if(!globalThis.HonroProfileStore?.verifyLegacy32Assets(old)){requests.delete(new URL(manifest.compatibility32,root).href+'|false');throw Error('Invalid Stage 32 compatibility art');}
    for(const asset of old){const key='act4compat32:v1:'+asset.id;if(assets.has(asset.id)||assets.has(key))throw Error('Conflicting Stage 32 compatibility art');}
    for(const asset of old){const key='act4compat32:v1:'+asset.id;assets.set(key,{...asset,id:key});}
    project.library=[...assets.values()];compatibility32Loaded=true;
   })();try{await compatibility32Loading;}finally{compatibility32Loading=null;}return;
  }`);
 write(loader,old,s);
}
{
 const old=stock(profile);let s=old;
 s=replace(s,"// Exact archived 33 QA art;",`// Stage 32 only. Neither unidentified old art nor workshop art can use this archive route.
const ACT4_32_LEGACY=Object.freeze(${sigRows});
const legacy32Scope=b=>!!b&&b.mode==='campaign'&&b.honroStage===32&&b.honroAct4Official===1&&b.honroMapOrigin==='campaign'&&!b.honroCustom;
function legacy32Art(b,id,signature,library){
 if(!legacy32Scope(b)||!Object.hasOwn(ACT4_32_LEGACY,id)||signature!==ACT4_32_LEGACY[id])return null;
 const archived=library.get('act4compat32:v1:'+id);if(!archived?.vector||archived.collision?.length||archived.interactionType)return null;
 const asset={...archived,id},text=JSON.stringify(asset);if(assetSignature(text)!==signature)return null;return{asset,text,signature};
}
function needsLegacy32Art(b){
 if(!legacy32Scope(b))return false;
 for(const items of [b.honroLandmarks,b.honroElements,b.honroEnvironment?.placements])if(Array.isArray(items))for(const item of items){
  const a=item?.asset;if(a?.honroStaticAssetRef===1&&Object.hasOwn(ACT4_32_LEGACY,a.id)&&a.signature===ACT4_32_LEGACY[a.id])return true;
 }
 return false;
}
function verifyLegacy32Assets(items){
 if(!Array.isArray(items)||items.length!==3)return false;
 const library=new Map(items.map(a=>[a?.id,a]));
 return library.size===3&&Object.entries(ACT4_32_LEGACY).every(([id,signature])=>{
  const a=library.get(id);return !!a?.vector&&!a.collision?.length&&!a.interactionType&&assetSignature(JSON.stringify(a))===signature;
 });
}
// Exact archived 33 QA art;`);
 s=replace(s,"const asset=item.asset,source=asset?.vector&&library.get(asset.id);if(!source)return item;",`const asset=item.asset,source=asset?.vector&&library.get(asset.id);
   if(!source){const old=asset?.vector&&legacy32Art(b,asset.id,ACT4_32_LEGACY[asset.id],library);if(!old||JSON.stringify(asset)!==old.text)return item;
    changed=true;return{...item,asset:{honroStaticAssetRef:1,id:asset.id,signature:old.signature}};}`);
 s=replace(s,"let source=library.get(ref.id);if(!source)return false;",`let source=library.get(ref.id);
  if(!source){const old=legacy32Art(b,ref.id,ref.signature,library);if(!old)return false;source=old.asset;}`);
 s=replace(s,"restoreBattleArt,needsLegacy33Art,","restoreBattleArt,needsLegacy32Art,verifyLegacy32Assets,needsLegacy33Art,");
 write(profile,old,s);
}
wr(proof,JSON.stringify({scope:'Stage32 normal packet / exact lazy 3 providers only; no native art, prior stages, authored library or gameplay changes',sourceFiles:receipt,archive:{sha256:arch,rows}},null,2)+'\n');
