/** Isolated Stage36 density pilot. Never overwrites the accepted/baseline package.
 * Art changes are explicitly scoped; gameplay fields and dynamic door identity
 * remain byte-equivalent to the baseline. No automatic visual approval. */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {extendBodyDomain} from '../vector-production/extend-body-domain.mjs';
import {deduplicateAsset} from '../vector-production/deduplicate-vector.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const args=process.argv.slice(2),option=k=>{const i=args.indexOf(k);return i<0?null:args[i+1];};
const out=option('--out')||'_local/reports/stage36-density-v2';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const base=await read('art/stage36-vector-production/stage36-production-package.json');
const g=await runtime({legacyMaps:false}),project=structuredClone(g.HONRO_PROJECT);
const stage=structuredClone(base.stage);
project.stages=[stage];project.activeStageId=stage.id;
project.library=project.library.filter(a=>!base.library.some(b=>b.id===a.id));
project.library.push(...structuredClone(base.library));
const views=[
{id:'house-normal',x:2570,y:1900,scale:.53,width:1440,height:900},
{id:'house-detail',x:2570,y:1900,scale:1.1,width:1440,height:900},
{id:'house-mobile',x:2570,y:1900,scale:.53,width:720,height:1100},
{id:'whole',x:3600,y:1900,scale:1500/7200,width:1600,height:850}];
project.production={...(project.production||{}),cards:{...(project.production?.cards||{}),[stage.id]:{cameraViews:views}}};
await mkdir(out,{recursive:true});
await writeFile(`${out}/baseline-project.json`,JSON.stringify(project));
const changes=[];
function install(a){assert(a.vector&&a.id,'Vector asset required');assert.deepEqual(a.collision,[],'Art-only assets must have empty collision');const existing=project.library.find(x=>x.id===a.id);assert(!existing,'New scoped ID required: '+a.id);project.library.push(a);}
const homeFile=option('--home');if(homeFile){const a=await read(homeFile);assert.equal(a.id,'s36-density:home');install(a);const e=stage.elements.find(e=>e.id==='a4-36-house-2570');assert.equal(e.assetId,'a4-production:ironless-home');e.assetId=a.id;const far=stage.environment.placements.filter(p=>p.assetId==='a4-production:ironless-home');for(const p of far)p.assetId=a.id;changes.push({instances:[e.id,...far.map(p=>p.id)],asset:a.id,source:homeFile});}
for(const [flag,oldId,newId] of [['--frame','a4-production:ironless-frame','s36-density:frame'],['--foundation','a4-production:ironless-foundation','s36-density:foundation']]){const file=option(flag);if(!file)continue;const a=await read(file);assert.equal(a.id,newId);install(a);const placements=[...stage.elements,...stage.environment.placements].filter(e=>e.assetId===oldId);assert(placements.length,'Missing '+oldId);for(const e of placements)e.assetId=a.id;changes.push({instances:placements.map(e=>e.id),asset:a.id,source:file});}
const doorFile=option('--door');if(doorFile){const a=await read(doorFile);assert(a.id.startsWith('s36-density:'));assert.notEqual(a.id,'a4:door');install(a);stage.design.vectorDoorAssetId=a.id;changes.push({paintOnly:a.id,source:doorFile});}
// Optional SURFACE is a noncolliding authored contact band in world coordinates.
const surfaceFile=option('--surface');if(surfaceFile){const a=await read(surfaceFile);assert(a.id.startsWith('s36-density:'));
 const profile=stage.terrains[0].points.filter(p=>p.y<3000).sort((a,b)=>a.x-b.x),floor=x=>{for(let i=1;i<profile.length;i++){const l=profile[i-1],r=profile[i];if(l.x<=x&&r.x>=x)return l.y+(r.y-l.y)*(x-l.x)/(r.x-l.x);}throw Error('Missing contact support');};
 const top=[{x:1600,y:floor(1600)},...profile.filter(p=>p.x>1600&&p.x<3400),{x:3400,y:floor(3400)}];
 const band=top.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join(' ')+top.slice().reverse().map(p=>'L'+p.x+' '+(p.y+80)).join(' ')+'Z';
 a.vector.clips={...a.vector.clips,densityContactBand:[band]};a.vector.root={tag:'g',clipPath:'densityContactBand',children:[a.vector.root]};a.params={...a.params,contactBand:{x0:1600,x1:3400,depth:80,topSource:stage.terrains[0].id,collisionUnchanged:true}};install(a);stage.elements.push({id:'s36-density:surface',assetId:a.id,x:0,y:0,scale:1,rotation:0,depthLayer:'L1',layer:'front'});changes.push({surface:a.id,source:surfaceFile});}
const bodyFile=option('--body');if(bodyFile){const a=await read(bodyFile);assert(a.id.startsWith('s36-density:'));
 const expanded=extendBodyDomain(a,{terrainPoints:stage.terrains[0].points,left:-280,right:7480,baseColor:'#666a62',deepTop:3450,deepBottom:4400});
 for(const asset of [expanded.body,...expanded.extensions]){const q=deduplicateAsset(asset).asset;install(q);const suffix=q.id.slice(a.id.length),e=stage.elements.find(e=>e.assetId==='s36v:body-continuous'+suffix);assert(e,'Missing original BODY placement '+suffix);e.assetId=q.id;}
 stage.design.vectorGround.baseColor='#666a62';changes.push({body:a.id,source:bodyFile,domainExtensions:'same source, original domain mapping',baseColor:'#666a62'});
}
for(const key of ['terrains','units','events','encounters','objectives','markers','initialState','playBounds','terrainBounds'])assert.deepEqual(stage[key],base.stage[key],`Gameplay field changed: ${key}`);
assert.deepEqual(stage.elements.find(e=>e.id==='a4-36-door-4'),base.stage.elements.find(e=>e.id==='a4-36-door-4'));
const restored=structuredClone(stage);for(const e of restored.elements){const old=base.stage.elements.find(b=>b.id===e.id);if(old)e.assetId=old.assetId;}for(const e of restored.environment.placements){const old=base.stage.environment.placements.find(b=>b.id===e.id);if(old)e.assetId=old.assetId;}restored.elements=restored.elements.filter(e=>e.id!=='s36-density:surface');restored.design.vectorDoorAssetId=base.stage.design.vectorDoorAssetId;restored.design.vectorGround=structuredClone(base.stage.design.vectorGround);assert.deepEqual(restored,base.stage,'Unlisted stage modification');
await writeFile(`${out}/candidate-project.json`,JSON.stringify(project));
const activeArtIds=new Set([...stage.elements,...stage.environment.placements].map(e=>e.assetId).concat(stage.design.vectorDoorAssetId));
await writeFile(`${out}/pilot-package.json`,JSON.stringify({version:1,status:'isolated density pilot; visual review pending',stage,library:project.library.filter(a=>activeArtIds.has(a.id)&&(base.library.some(b=>b.id===a.id)||a.id.startsWith('s36-density:')))}));
await writeFile(`${out}/assembly.json`,JSON.stringify({changes,gameplayPreserved:true,originalDoorInstancePreserved:true,visualApproval:false,views,baselinePackage:'art/stage36-vector-production/stage36-production-package.json'},null,2));
console.log(JSON.stringify({out,changes,visualApproval:false}));
