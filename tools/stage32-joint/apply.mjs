import {readFileSync as rd,writeFileSync as wr,mkdirSync}from'node:fs';
import {resolve,dirname,join}from'node:path';
import {fileURLToPath}from'node:url';import {createHash}from'node:crypto';
const [a,b,proof]=process.argv.slice(2).map(x=>resolve(x));
const need=(v,e)=>{if(!v)throw Error(e);},sha=x=>createHash('sha256').update(x).digest('hex');
const gitBlob=x=>createHash('sha1').update(`blob ${Buffer.byteLength(x)}\0`).update(x).digest('hex');
const rows={'approved32:body':'1952606:e60eb3e5','approved32:wood-door-extract':'423282:b2c53b27','act4-handoff:32:body':'843583:aede1464'};
const idArray=JSON.stringify(Object.keys(rows)), sigRows=JSON.stringify(rows), arch='ee7846c92c4edcac5f88771849e89c896a5c6906b0b8c10fb90cdca1d5b1061d';
const pins={'shared/web-build.mjs':'761f6c6a757b3cdb16616ad17195e9d614cc11c3','shared/web-loader.js':'87a9c964211acf9f3f92c69dc31d8c2234d26c72','shared/runtime/profile-store.js':'400eca67810f433bfe4a8952f76d366d8948ac11'};
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
 const old=stock(profile),s=rd(fileURLToPath(new URL('./profile-candidate.js',import.meta.url)),'utf8');
 need(gitBlob(s)==='b11ad06d788fd21c47d89caa415477b85397b9f4'&&sha(s)==='48e6dcd406a503e3acf2c7cd8af7fec01bf44d924075c2c48a2063f900a03724','exact three-way profile');
 write(profile,old,s);
}
wr(proof,JSON.stringify({scope:'Stage32 exact lazy 3 providers and combined independently proven profile. Stage42 author proof separate; 33/40/46 unchanged.',sourceFiles:receipt,archive:{sha256:arch,rows}},null,2)+'\n');
