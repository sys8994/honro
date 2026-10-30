/** Reuse a natively traced wood module, cropped/sheared onto existing wood routes only. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {runtime} from '../../game/tests/helpers.mjs';
import {deduplicateAsset} from '../vector-production/deduplicate-vector.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const read=async p=>JSON.parse(await readFile(p,'utf8')),g=await runtime({legacyMaps:false});
const src=await read('art/vector-gameplay-density-v2/wood-platform-asset.json');
const root='art/vector-gameplay-density-v2',out='_local/reports/wood-density-rollout';await mkdir(out,{recursive:true});
const report={source:'wood-platform-asset.json',method:'Horizontal 1:1 cropping and shear. Vertical compression only for routes thinner than46world. Geometry unchanged. No thatch/stone repaint.',stages:[]};
for(const n of[31,37,39,40]){
 const d=`art/stage${n}-vector-production/package`,s=await read(d+'/stage.json'),lib=await read(d+'/library.json'),p=structuredClone(g.HONRO_PROJECT);p.stages=[s];p.activeStageId=s.id;p.library=[...p.library.filter(a=>!lib.some(b=>a.id===b.id)),...lib];
 const before=g.HonroMaps.compile(s,p).terrain,routes=s.terrains.filter(t=>t.baseMaterial==='wood'&&(n!==31||t.properties?.honroProductionWalkway));
 const views=[];let summaries=[];
 for(const [r,t] of routes.entries()){
  const physical=before.find(q=>q.id===t.id);assert(physical);const poly=g.HONRO_CORE.poly(physical),path=poly.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z';
  const top=t.control||t.points.slice(0,t.points.length/2),thickness=t.thickness||24,depth=Math.min(46,thickness),sy=depth/46;
  const a=structuredClone(src),clips={...a.vector.clips,physical:[path]},children=[];let parts=[];
  for(let i=0;i<top.length-1;i++){
   const start=top[i],end=top[i+1],slope=(end.y-start.y)/(end.x-start.x);assert(end.x>start.x);
   for(let x=start.x;x<end.x;x+=640){const right=Math.min(end.x,x+640),y=start.y+slope*(x-start.x),yr=start.y+slope*(right-start.x),name='segment'+parts.length;
    clips[name]=[`M${x} ${y}L${right} ${yr}V${yr+depth}L${x} ${y+depth}Z`];
    children.push({tag:'g',clipPath:name,children:[{tag:'g',transform:[1,slope,0,sy,x-1660,y-sy*1760-slope*1660],children:[structuredClone(src.vector.root)]}]});
    parts.push({x,right,y,yr,depth,horizontalScale:1,verticalScale:sy});
   }
  }
  a.id=`s${n}-density:wood-${r}`;a.name=`${n}장 ${t.id} 목재 구조면`;a.bounds={x:Math.min(...top.map(q=>q.x)),y:Math.min(...top.map(q=>q.y)),w:Math.max(...top.map(q=>q.x))-Math.min(...top.map(q=>q.x)),h:Math.max(...top.map(q=>q.y))-Math.min(...top.map(q=>q.y))+depth};a.reference.bounds={...a.bounds};a.vector.viewBox=[a.bounds.x,a.bounds.y,a.bounds.w,a.bounds.h];a.vector.clips=clips;a.vector.root={tag:'g',clipPath:'physical',children};a.params.sourceRole=`Physical wood route ${t.id}; source-derived face detail; not collision`;
  const result=deduplicateAsset(a),asset=result.asset;assert.equal(g.HonroVectorArt.validate(asset.vector).length,0);
  const file=`${root}/wood-stage${n}-route${r}-asset.json`;if(n!==31)await writeFile(file,JSON.stringify(asset)+'\n');p.library.push(asset);
  const instance={id:a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,snap:false,depthLayer:'L1',layer:'front',visualRole:'scenery'};
  // Paint before existing body: solid land naturally occludes buried route ends.
  let replacement=null;if(n===40){const old=s.elements.find(e=>e.id==='s40v:surface');assert(old);replacement={instanceId:old.id,previousAssetId:old.assetId};old.assetId=a.id;}else{let at=s.elements.findIndex(e=>/body/.test(e.id));if(at<0)at=s.elements.length;s.elements.splice(at,0,instance);}
  summaries.push({terrainId:t.id,assetId:a.id,file,instance,replacement,placement:'before first BODY element; preserve other ordering',parts,thickness,depth,deduplication:result.report});
  const mid=top[Math.floor((top.length-1)/2)];views.push({id:`route${r}-normal`,x:(top[0].x+top.at(-1).x)/2,y:mid.y,scale:.53,width:1440,height:900},{id:`route${r}-detail`,x:mid.x+150,y:mid.y,scale:1.1,width:1440,height:900});
 }

 if(n===31){
  const assets=summaries.map(q=>p.library.find(a=>a.id===q.assetId)),merged=structuredClone(assets[0]),allClips={},allRoots=[];
  for(const [i,a] of assets.entries()){
   const rewrite=node=>{if(node.tag==='use')return rewrite(a.vector.symbols[node.symbol]);const copy=structuredClone(node);if(copy.clipPath)copy.clipPath='route'+i+'-'+copy.clipPath;if(copy.children)copy.children=copy.children.map(rewrite);return copy;};
   for(const [k,v] of Object.entries(a.vector.clips))allClips['route'+i+'-'+k]=v;
   allRoots.push(rewrite(a.vector.root));
  }
  merged.id='s31-density:wood-boardwalks';merged.bounds={x:1290,y:1770,w:2260,h:114};merged.reference.bounds={...merged.bounds};merged.vector={version:1,viewBox:[1290,1770,2260,114],clips:allClips,root:{tag:'g',children:allRoots}};
  const result=deduplicateAsset(merged);assert.equal(g.HonroVectorArt.validate(result.asset.vector).length,0);const file=root+'/wood-stage31-boardwalks-asset.json';await writeFile(file,JSON.stringify(result.asset)+'\n');
  const instance={...summaries[0].instance,id:merged.id,assetId:merged.id},at=s.elements.findIndex(e=>e.id===summaries[0].instance.id);s.elements=s.elements.filter(e=>!summaries.some(q=>q.instance.id===e.id));s.elements.splice(at,0,instance);p.library=p.library.filter(a=>!summaries.some(q=>q.assetId===a.id));p.library.push(result.asset);
  summaries=[{terrainIds:summaries.map(q=>q.terrainId),assetId:merged.id,file,instance,replacement:null,placement:'before first BODY element',parts:summaries.flatMap(q=>q.parts),thickness:24,depth:24,deduplication:result.report}];
 }
 assert.deepEqual(g.HonroMaps.compile(s,p).terrain,before,'Physics changed');p.production={cards:{[s.id]:{cameraViews:views}}};await writeFile(`${out}/stage${n}-candidate.json`,JSON.stringify(p));
 const base=structuredClone(p);base.stages[0].elements=base.stages[0].elements.filter(e=>!summaries.some(q=>q.instance.id===e.id));for(const q of summaries){if(q.replacement)base.stages[0].elements.find(e=>e.id===q.replacement.instanceId).assetId=q.replacement.previousAssetId;}await writeFile(`${out}/stage${n}-baseline.json`,JSON.stringify(base));report.stages.push({stage:n,compiledPhysicsPreserved:true,visualApproval:false,routes:summaries});
}
await writeFile(`${root}/wood-rollout-manifest.json`,JSON.stringify(report,null,2));console.log(report.stages.map(s=>({stage:s.stage,routes:s.routes.length,bytes:s.routes.map(r=>r.deduplication.afterBytes)})));
