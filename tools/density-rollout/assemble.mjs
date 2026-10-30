/** Isolated Act4 role-density integration. Visual comparison, never release approval. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {runtime} from '../../game/tests/helpers.mjs';
import {extendBodyDomain} from '../vector-production/extend-body-domain.mjs';
import {fitGroundedFrame} from './fit-grounded-frame.mjs';
import {warpContactDepth} from '../vector-production/warp-contact-depth.mjs';
import {deduplicateAsset} from '../vector-production/deduplicate-vector.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const inputs=new Map();
const out=process.argv[2]||'_local/reports/density-rollout',read=async f=>{const raw=await readFile(f,'utf8');inputs.set(f,{path:f,sha256:createHash('sha256').update(raw).digest('hex'),bytes:Buffer.byteLength(raw)});return JSON.parse(raw);},clone=structuredClone,path=ps=>ps.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z';
const g=await runtime({legacyMaps:false}),baseProject=clone(g.HONRO_PROJECT),all=[],records=[];
const pilot=Object.fromEntries([32,35,36].map(n=>[n,`${out}/inputs/${n}/candidate-project.json`]));
// Rebuild the approved-direction pilots from committed sources. No ignored
// historical project is required to reproduce this review integration.
for(const[n,script,args]of[
 [32,'tools/stage32-density-v2/assemble.mjs',['--stage','32','--surface','art/vector-gameplay-density-v2/wood-platform-asset.json','--whole-route','--body','art/stage32-density-v2/body-asset.json','--building','art/vector-gameplay-density-v2/coastal-house-32-asset.json','--contact','art/vector-gameplay-density-v2/contact-soil32-warped-asset.json']],
 [35,'tools/stage32-density-v2/assemble.mjs',['--stage','35','--surface','art/vector-gameplay-density-v2/stone-steps-asset.json','--body','art/stage35-density-v2/body-depthfade-asset.json']],
 [36,'tools/stage36-density-v2/assemble.mjs',['--home','art/stage36-density-v2/home-asset.json','--frame','art/stage36-density-v2/frame-quiet-asset.json','--foundation','art/stage36-density-v2/foundation-quiet-asset.json','--door','art/stage36-density-v2/door-asset.json','--surface','art/stage36-density-v2/contact-clusters-blended-asset.json','--body','art/stage36-density-v2/body-asset.json']]
])execFileSync(process.execPath,[script,...args,'--out',`${out}/inputs/${n}`],{stdio:'inherit'});

const originalBody={31:'s31v:body-continuous',33:'s33v:tidal-bank-body',34:'s34v:body',37:'s37v:body',39:'s39v:body',40:'s40v:body'};
const bases={31:'#475760',33:'#2d4350',34:'#455863',37:'#283344',38:'#435661',39:'#2a3647',40:'#283a4a'};
const normal={31:[1900,1920],32:[1980,1800],33:[2200,2130],34:[900,4700],35:[760,1840],36:[2300,1960],37:[1700,2950],38:[2900,2650],39:[4500,2100],40:[4200,1900]};
const flatten=n=>{if(n.children)n.children=n.children.flatMap(c=>{flatten(c);return c.tag==='g'&&Object.keys(c).every(k=>k==='tag'||k==='children')?c.children:[c];});return n;};
const unwrap=a=>{let r=a.vector.root;while(r.clipPath&&r.children?.length===1)r=r.children[0];return r;};
for(let n=31;n<=40;n++){
 const source=n===35||n===36?await read(`art/stage${n}-vector-production/stage${n}-production-package.json`):{stage:await read(`art/stage${n}-vector-production/package/stage.json`),library:await read(`art/stage${n}-vector-production/package/library.json`)};
 let p=clone(baseProject),s=clone(source.stage);p.stages=[s];p.activeStageId=s.id;p.library=[...p.library.filter(a=>!source.library.some(b=>b.id===a.id)),...clone(source.library)];
 const before=clone(g.HonroMaps.compile(s,p).terrain),baseline=clone(p),changes=[];
 const install=(asset,oldId)=>{
  flatten(asset.vector.root);const old=p.library.find(x=>x.id===oldId);assert(old,'Old asset '+oldId);assert.deepEqual(asset.collision,old.collision,'Asset collision '+oldId);
  const expandedCount=(node,v)=>1+(node.tag==='use'?expandedCount(v.symbols[node.symbol],v):(node.children||[]).reduce((sum,c)=>sum+expandedCount(c,v),0));
  let parts=[asset];const errors=clone(g.HonroVectorArt.validate(asset.vector));
  if(errors.length||(asset.params?.domainContinuation&&expandedCount(asset.vector.root,asset.vector)>460)){assert(asset.params?.domainContinuation&&asset.vector.root.children?.length>1,'Only original reflected-domain segments may be partitioned');parts=[];let children=[];const push=()=>{const a=clone(asset);a.id=asset.id+'-part-'+parts.length;a.vector.root.children=children;parts.push(a);children=[];};for(const node of asset.vector.root.children){const test=clone(asset);test.vector.root.children=[...children,node];if(g.HonroVectorArt.validate(test.vector).length||expandedCount(test.vector.root,test.vector)>460){assert(children.length,'One domain segment exceeds limits');push();}children.push(node);}if(children.length)push();}
  parts=parts.map(part=>{const a=deduplicateAsset(part).asset;assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[],'Vector limits '+a.id);p.library.push(a);return a;});
  let count=0;for(const collection of [s.elements,s.environment?.placements||[]]){for(let i=collection.length-1;i>=0;i--){const e=collection[i];if(e.assetId!==oldId)continue;const originals=parts.map((a,j)=>({...clone(e),id:j?e.id+'-density-part-'+j:e.id,assetId:a.id}));collection.splice(i,1,...originals);count++;}}assert(count,'No references '+oldId);changes.push({oldId,newIds:parts.map(a=>a.id),instances:count,oldBytes:JSON.stringify(old).length,newBytes:parts.reduce((sum,a)=>sum+JSON.stringify(a).length,0),domainPartition:parts.length>1?'Original disjoint reflected segments, same order and clips. Runtime limits unchanged.':null});
 };
 if(pilot[n]){p=await read(pilot[n]);s=p.stages[0];changes.push({pilot:pilot[n]});}
 else if(n===38){
  const floor=await read('art/stage38-density-face-v3/floor-asset.json'),roof=await read('art/stage38-density-depthfade/roof-asset.json'),floorTop=s.terrains.filter(t=>!t.properties?.honroCeiling).flatMap(t=>t.points.filter(q=>q.y<4000)),floorClips=s.terrains.filter(t=>!t.properties?.honroCeiling).map(t=>path(t.points));
  for(const t of s.terrains){const ceiling=!!t.properties?.honroCeiling,a=clone(ceiling?roof:floor),oldId='s38v:body-'+t.id.replace('a4-38-','');a.id='s38-density:body-'+t.id.replace('a4-38-','');a.vector.root=unwrap(a);a.vector.clips={exact:[path(t.points)]};a.vector.root={tag:'g',clipPath:'exact',children:[a.vector.root]};a.params={...a.params,collisionAuthority:'official:'+t.id};let extension;
   if(t.id==='a4-38-land')extension=extendBodyDomain(a,{terrainPoints:t.points,topPoints:floorTop,left:-378,right:3300,leftBreaks:[-6000,-3200,-378],rightBreaks:[],baseColor:bases[n],deepTop:4650,deepBottom:40000});
   if(t.id==='a4-38-east')extension=extendBodyDomain(a,{terrainPoints:t.points,topPoints:floorTop,left:4300,right:7578,leftBreaks:[],rightBreaks:[7578,10400,13200],baseColor:bases[n],deepTop:4650,deepBottom:40000});
   if(ceiling){const end=t.points.findIndex(q=>q.x===-6000&&q.y>1000),bottomChain=t.points.slice(3,end+1);extension=extendBodyDomain(a,{terrainPoints:t.points,topPoints:bottomChain,left:-378,right:3300,leftBreaks:[-6000,-3200,-378],rightBreaks:[],deepBottom:3200});}
   if(extension){if(!ceiling)extension.body.vector.clips.ground=floorClips;install(extension.body,oldId);for(const x of extension.extensions)install(x,oldId+x.id.slice(a.id.length));}
   else{const raw=a.vector.root;a.vector.clips.exact=floorClips;a.vector.clips.ownership=['M3300 0H4300V40000H3300Z'];a.vector.root={tag:'g',clipPath:'ownership',pixelSnapClip:true,children:[{tag:'g',clipPath:'exact',children:[raw,{tag:'path',d:'M3200 4650H4550V40000H3200Z',fill:bases[n]}]}]};install(a,oldId);}
  }s.design.vectorGround.baseColor=bases[n];
 }else{
  const a=await read(n===34?'art/stage34-density-face-v3/body-asset.json':n===33?'art/stage33-density-cap-v3/body-asset.json':n===37?'art/stage37-density-seam-v3/body-asset.json':[31,39,40].includes(n)?`art/stage${n}-density-depthfade/body-asset.json`:`art/stage${n}-density-v2/body-asset.json`),land=s.terrains.find(t=>t.id===(n===31?'s31-estuary-bank':`a4-${n}-land`)),top=land.points.filter(q=>q.y<(n===34||n===39?10000:n===37?20000:3000));
  const oldId=originalBody[n],oldLeft=p.library.find(x=>x.id===oldId+'-domain-left').params.domainContinuation,oldRight=p.library.find(x=>x.id===oldId+'-domain-right').params.domainContinuation;
  const config={terrainPoints:land.points,topPoints:top,left:oldLeft.edge,right:oldRight.edge,leftBreaks:oldLeft.breaks,rightBreaks:oldRight.breaks,baseColor:bases[n],deepTop:({31:4250,33:4400,34:6900,37:4900,39:4350,40:3900})[n],deepBottom:n===31?27100:n===33?5050:40000};
  if(n===34){const deepChain=clone(top).sort((a,b)=>a.x-b.x).map(q=>({x:q.x,y:q.y+1800}));a.vector.root={tag:'g',children:[unwrap(a),{tag:'path',d:path([...deepChain,{x:13600,y:40000},{x:-6000,y:40000}]),fill:bases[n]}]};}
  const domain=extendBodyDomain(a,config);install(domain.body,oldId);for(const x of domain.extensions)install(x,oldId+x.id.slice(a.id.length));s.design.vectorGround.baseColor=bases[n];
  if(n===34){const overhang=await read('art/stage34-density-depthfade/overhang-asset.json'),roof=s.terrains.find(t=>t.id==='a4-34-natural-overhang'),roofPath=path(roof.points),texture=unwrap(overhang),upper=[...roof.points.slice(20),...roof.points.slice(0,5)].sort((a,b)=>a.x-b.x),cap=path([...upper,...upper.slice().reverse().map(q=>({x:q.x,y:q.y+35}))]);overhang.vector.clips={...overhang.vector.clips,physicalRoof:[roofPath]};overhang.vector.root={tag:'g',clipPath:'physicalRoof',children:[{tag:'path',d:roofPath,fill:bases[n]},{tag:'g',transform:[1.02,0,0,1.15,24,-495],children:[texture]},{tag:'path',d:cap,fill:'#71838b'}]};install(overhang,'s34v:overhang');}
 }

 if(n===32){const a=await read('art/stage32-density-depthfade/body-asset.json'),oldId='s32-density:body',land=s.terrains.find(t=>t.id==='a4-32-land'),left=p.library.find(a=>a.id===oldId+'-domain-left').params.domainContinuation,right=p.library.find(a=>a.id===oldId+'-domain-right').params.domainContinuation;const domain=extendBodyDomain(a,{terrainPoints:land.points,topPoints:land.points.filter(q=>q.y<3000),left:left.edge,right:right.edge,leftBreaks:left.breaks,rightBreaks:right.breaks,baseColor:'#283344',deepTop:3400,deepBottom:40000});for(const a of [domain.body,...domain.extensions])install(a,oldId+a.id.slice(domain.body.id.length));}
 if(n===31){const a=await read('art/stage36-density-v2/frame-quiet-asset.json'),old=p.library.find(a=>a.id==='s31v:landing-ruin');assert.deepEqual(a.bounds,old.bounds);a.id='s31-density:landing-ruin';a.reference.scaleRange=clone(old.reference.scaleRange);a.reference.backgroundRange=clone(old.reference.backgroundRange);install(a,old.id);}
 if(n===40){const a=await read('art/vector-gameplay-density-v2/coastal-house-asset.json'),old=p.library.find(a=>a.id==='s40v:port-house');assert.deepEqual(a.reference.bounds,old.reference.bounds);install(a,old.id);}
 const wood=(await read('art/vector-gameplay-density-v2/wood-rollout-manifest.json')).stages.find(q=>q.stage===n);if(wood)for(const r of wood.routes){const a=await read(r.file);assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[]);p.library.push(a);if(r.replacement){const e=s.elements.find(e=>e.id===r.replacement.instanceId);assert(e);assert.equal(e.assetId,r.replacement.previousAssetId);e.assetId=a.id;}else{const at=s.elements.findIndex(e=>{const a=p.library.find(a=>a.id===e.assetId);return a?.params?.semanticLayer==='BODY'||a?.params?.artRole==='BODY';});assert(at>=0);s.elements.splice(at,0,clone(r.instance));}changes.push({wood:r.file,assetId:a.id,replacement:r.replacement||null});}

 for(const r of (await read('art/stone-cover-density-v2/manifest.json')).replacements.filter(r=>r.stage===n)){const a=await read(r.file);install(a,r.oldAsset);}
 if(n===35){const r=await read('art/vector-stone-modules/integration.json'),a=await read(r.assetFile);assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[]);assert.deepEqual(a.collision,[]);p.library.push(a);s.elements.push(r.element);changes.push({stone:r.assetFile,assetId:a.id});}

 if([31,33,37,39,40].includes(n)){const sourceContact=await read([31,33].includes(n)?'art/stage31-contact-density/contact-soil31-asset.json':'art/vector-gameplay-density-v2/contact-soil32-asset.json'),config=await read('art/vector-gameplay-density-v2/contact-soil32-warp-config.json'),land=s.terrains.find(t=>t.id===(n===31?'s31-estuary-bank':`a4-${n}-land`)),targetTop=land.points.filter(q=>q.y<20000&&q.x>=0&&q.x<=s.width).sort((a,b)=>a.x-b.x);for(let start=0;start<s.width;start+=3600){const end=Math.min(start+3600,s.width),r=warpContactDepth(sourceContact,{...config,id:`s${n}-density:soil-contact-${start}`,targetTop,start,end});const a=r.asset;a.vector.clips.exactLand=[path(land.points)];a.vector.root={tag:'g',clipPath:'exactLand',children:[a.vector.root]};assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[]);p.library.push(a);s.elements.push({id:a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'front',visualRole:'scenery'});changes.push({soilContact:a.id,source:'contact-soil32-asset.json',mapping:r.report,scope:'Shared ochre palette candidate; visual inspection required.'});}}

 for(const r of (await read('art/stone-contact-density-v2/integration.json')).assets.filter(r=>r.stage===n&&r.selection==='candidate')){const a=await read(r.assetFile);assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[]);assert.deepEqual(a.collision,[]);p.library.push(a);s.elements.push(r.element);changes.push({stoneContact:r.assetFile,assetId:a.id,physicalTerrain:r.physicalTerrain});}

 if(n===37){const r=await read('art/stage37-signal-density/integration.json'),a=await read(r.assetFile);install(a,r.replaceAssetId);}
 if(n===37){const source=await read('art/stage36-density-v2/frame-quiet-asset.json'),old=p.library.find(a=>a.id==='a4-art:workshop-ruin'),instance=s.elements.find(e=>e.assetId===old.id),a=fitGroundedFrame(source,{width:old.reference.bounds.w,instance,terrainPoints:s.terrains.find(t=>t.id==='a4-37-land').points,id:'s37-density:workshop-frame'});a.reference.foot=clone(old.reference.foot);a.reference.scaleRange=clone(old.reference.scaleRange);a.reference.backgroundRange=clone(old.reference.backgroundRange);install(a,old.id);}


 if([33,39].includes(n)){const r=await read(n===33?'art/stage33-surface-density-v2/integration.json':'art/stage39-stone-density/integration.json'),beforeId=r.insertBeforeElementId||`s${n}v:body-contact-underpaint`;s.elements=s.elements.filter(e=>!r.removeElementIds.includes(e.id));const at=s.elements.findIndex(e=>e.id===beforeId);assert(at>=0);const elements=[];for(const row of r.additions){const a=await read(row.assetFile);assert.deepEqual(clone(g.HonroVectorArt.validate(a.vector)),[]);assert.deepEqual(a.collision,[]);p.library.push(a);elements.push(row.element);}s.elements.splice(at,0,...elements);changes.push({stoneRefuges:n===33?'art/stage33-surface-density-v2/integration.json':'art/stage39-stone-density/integration.json'});}
 assert.deepEqual(clone(g.HonroMaps.compile(s,p).terrain),before,'Compiled terrain changed '+n);
 for(const k of ['terrains','units','materials','events','encounters','objectives','markers','initialState'])assert.deepEqual(s[k],source.stage[k],'Gameplay field changed '+n+' '+k);
 const[x,y]=normal[n],views=[{id:'normal',x,y,scale:.53,width:1440,height:900},{id:'detail',x,y,scale:1.1,width:1440,height:900},{id:'mobile',x,y,scale:.53,width:720,height:1100},{id:'whole',x:s.width/2,y:n===34?3700:n===38?2300:2000,scale:1500/s.width,width:1600,height:850},{id:'right-domain',x:s.width-400,y:2300,scale:.28,width:1440,height:900}];
 const party=s.units.filter(u=>u.team==='player');if(party.length)views.push({id:'party',x:party.reduce((a,u)=>a+u.x,0)/party.length+400,y:party.reduce((a,u)=>a+u.y,0)/party.length-150,scale:.53,width:1440,height:900});
 if(n===34)views.push({id:'overhang',x:2650,y:3800,scale:.53,width:1440,height:900});if(n===38)views.push({id:'emergency',x:3800,y:3050,scale:.53,width:1440,height:900},{id:'ceiling-domain',x:300,y:1950,scale:.28,width:1440,height:900});
 for(const q of [p,baseline])q.production={cards:{[s.id]:{cameraViews:views}}};
 await mkdir(`${out}/${n}`,{recursive:true});await writeFile(`${out}/${n}/baseline-project.json`,JSON.stringify(baseline));await writeFile(`${out}/${n}/candidate-project.json`,JSON.stringify(p));
 records.push({stage:n,changes,compiledPhysicsPreserved:true,gameplayFieldsPreserved:true,visualApproval:false,sha256:createHash('sha256').update(JSON.stringify(p)).digest('hex')});all.push(p);console.log('assembled',n);
}
for(const input of inputs.values())assert.equal(createHash('sha256').update(await readFile(input.path)).digest('hex'),input.sha256,'Source changed during assembly: '+input.path);
await writeFile(`${out}/assembly.json`,JSON.stringify({scope:'Isolated local density candidates. No source package, official data, remote or release approval changes.',stages:records,inputs:[...inputs.values()]},null,2));
// Combined local review project contains official1–30 and only stage-referenced
// additions from the isolated candidates. Never copies unused pilot libraries.
const combined=clone(baseProject),assets=new Map(combined.library.map(a=>[a.id,a]));
function refs(v,ids=new Set()){if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){if((k==='assetId'||k.endsWith('AssetId'))&&typeof x==='string')ids.add(x);else if(x&&typeof x==='object')refs(x,ids);}return ids;}
for(const p of all){const s=p.stages[0],i=combined.stages.findIndex(x=>x.id===s.id);assert(i>=0);combined.stages[i]=clone(s);for(const id of refs(s)){const a=p.library.find(x=>x.id===id);assert(a,'Missing reference '+id);if(assets.has(id))assert.deepEqual(assets.get(id),a,'Conflicting shared asset '+id);else assets.set(id,clone(a));}}
combined.library=[...assets.values()];combined.activeStageId='stage-31';combined.production={cards:Object.assign({},...all.map(p=>p.production.cards))};
await writeFile(`${out}/project.json`,JSON.stringify(combined));
