/** Appearance-only Stage33 assembly. Official geometry/events remain authoritative. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {deduplicateAsset} from '../vector-production/deduplicate-vector.mjs';
import {extendBodyDomain} from '../vector-production/extend-body-domain.mjs';
import {runtime} from '../../game/tests/helpers.mjs';
const dir='art/stage33-vector-production',read=async name=>JSON.parse(await readFile(name,'utf8')),clone=x=>JSON.parse(JSON.stringify(x));
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false});
const p=await read(`${dir}/official-project.json`),s=p.stages[0],original=clone(s);
const body=await read(`${dir}/body-asset.json`),top=s.terrains[0].points.filter(q=>q.y<3000);
const domain=extendBodyDomain(body,{terrainPoints:s.terrains[0].points,topPoints:top,left:-378,right:7978,leftBreaks:[-6000,-3200,-378],rightBreaks:[7978,10800,13600],baseColor:'#283e4a',deepTop:4400,deepBottom:5050});
const optimization=[];function add(a,layer='front'){if(!process.argv.includes('--plain')){const result=deduplicateAsset(a);a=result.asset;optimization.push({id:a.id,...result.report});}p.library.push(a);s.elements.push({id:a.id,assetId:a.id,x:0,y:0,scale:1,rotation:0,depthLayer:'L1',layer});}
// Contact underpaint follows the existing terrain top only. It closes small
// image-trace coverage gaps without inventing collision or an exterior skirt.
const chain=clone(top).sort((a,b)=>a.x-b.x),lipD=chain.map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+chain.slice().reverse().map(q=>'L'+q.x+' '+(q.y+160)).join(' ')+'Z';
const lip=clone(body);lip.id='s33v:body-contact-underpaint';lip.vector.root={tag:'path',d:lipD,fill:'#cba85e'};lip.bounds=lip.reference.bounds={x:-6000,y:0,w:19600,h:3000};lip.vector.viewBox=[-6000,0,19600,3000];add(lip);for(const a of [domain.body,...domain.extensions])add(a);
if(!process.argv.includes('--body-only')){const surface=await read(`${dir}/surface-asset.json`),compiled=g.HonroMaps.compile(s,p),paths=compiled.terrain.filter(t=>t.oneWay).map(t=>g.HONRO_CORE.poly(t).map((q,i)=>(i?'L':'M')+q.x+' '+q.y).join(' ')+'Z');surface.vector.clips={...(surface.vector.clips||{}),exactRefuges:paths};surface.vector.root={tag:'g',clipPath:'exactRefuges',children:[...paths.map(d=>({tag:'path',d,fill:'#c4a35d'})),{tag:'g',transform:[1,0,0,1,0,28],children:[surface.vector.root]}]};surface.params.contactFit={verticalOffset:28,clip:'actual compiled one-way polygons',underpaint:'inside source polygon only'};add(surface);}
const reed=await read('art/vector-common-production/reed-cluster-asset.json');reed.id='s33v:rear-reed-cluster';reed.params={...reed.params,semanticLayer:'REAR',artRole:'grounded reeds behind actors'};reed.reference.scaleRange=[.1,4];reed.reference.backgroundRange=[.1,4];p.library.push(reed);
for(const e of s.elements.filter(e=>e.assetId==='a4:reeds'))e.assetId=reed.id;
const fore=clone(reed);fore.id='s33v:fore-reed-cluster';fore.params.semanticLayer='FORE';fore.params.artRole='noncolliding lower-face foreground reeds';p.library.push(fore);
for(const [x,y,scale]of [[760,2195,1.1],[3020,2202,.85],[5550,2159,1.2]])s.elements.push({id:fore.id+'-'+x,assetId:fore.id,x,y,scale,rotation:0,depthLayer:'L1',layer:'front'});
// Reviewed common scenic props: actual ink foot anchored to existing support.
// Uniform source fit, no collider or gameplay/instance transform change.
for(const [name,sourceId] of [['coastal-boulder','env:rock'],['abandoned-skiff','a4-art:abandoned-skiff']]){
 const asset=await read(`${dir}/${name}-asset.json`),old=p.library.find(a=>a.id===sourceId);assert.deepEqual(old.collision,[]);asset.collision=[];asset.reference.scaleRange=old.reference.scaleRange;asset.reference.backgroundRange=old.reference.backgroundRange;p.library.push(asset);for(const e of s.elements.filter(e=>e.assetId===sourceId))e.assetId=asset.id;
}
// One quiet natural rear pier, re-used at the four ORIGINAL peak/base anchors.
const pier=await read(`${dir}/stone-pier-asset.json`);assert.deepEqual(pier.collision,[]);pier.reference.scaleRange=[.1,4];pier.reference.backgroundRange=[.1,4];p.library.push(pier);const pierFit=[];
for(const e of s.elements.filter(e=>e.assetId.startsWith('a4-coast:pier-33-'))){const old=p.library.find(a=>a.id===e.assetId);assert.deepEqual(old.collision,[]);const height=-old.reference.bounds.y-10,top=e.y-height,bottom=e.y+9;const source=e.assetId;e.assetId=pier.id;e.scale=(height+9)/300;e.y=bottom;assert(Math.abs(e.y-300*e.scale-top)<1e-7,'Original support peak retained');assert.equal(e.y,bottom);pierFit.push({id:e.id,sourceAsset:source,topWorld:top,bottomWorld:bottom,scale:e.scale,role:'noncolliding rear support, not firing cover'});}
// Scenic boulders follow their existing physical support tangent; bounded burial
// prevents a flat imported base hovering over the rising refuge. No terrain edits.
const scenicFit=[];for(const e of s.elements.filter(e=>e.assetId==='s33v:coastal-boulder')){
 const support=s.terrains.map(t=>({...t,points:t.points||t.control})).filter(t=>t.points?.some((v,i)=>i&&v.x>=e.x&&t.points[i-1].x<=e.x)).map(t=>{const i=t.points.findIndex((v,i)=>i&&v.x>=e.x&&t.points[i-1].x<=e.x),a=t.points[i-1],b=t.points[i];return {t,y:a.y+(b.y-a.y)*(e.x-a.x)/(b.x-a.x)};}).filter(v=>Number.isFinite(v.y)).sort((a,b)=>Math.abs(a.y-e.y)-Math.abs(b.y-e.y))[0];assert(support);const ps=support.t.points,i=ps.findIndex((v,i)=>i&&v.x>=e.x&&ps[i-1].x<=e.x),a=ps[i-1],b=ps[i];e.rotation=Math.atan2(b.y-a.y,b.x-a.x);e.y=support.y+6;scenicFit.push({id:e.id,support: support.t.id,rotation:e.rotation,burial:6,originalY:original.elements.find(v=>v.id===e.id).y,newY:e.y});
}
s.design.vectorWaterInsetTaper={version:1,zoneId:'a4-33-east-channel',side:'left',width:48};
s.design.vectorGround={version:1,baseColor:'#283e4a',visualDepth:'L1'};
// Palette only: live water, tide rules, refuges and enemy/party positions untouched.
s.design.act4.palette={...s.design.act4.palette,body:'#445c6e',seam:'#2d4350',deep:'#283e4a'};
for(const key of ['terrains','units','materials','encounters','events','initialState'])assert.deepEqual(s[key],original[key],key);
for(const old of original.elements){const now=clone(s.elements.find(e=>e.id===old.id));assert(now,'Original element retained '+old.id);if(['a4:reeds','env:rock','a4-art:abandoned-skiff'].includes(old.assetId))now.assetId=old.assetId;if(old.assetId.startsWith('a4-coast:pier-33-')){now.assetId=old.assetId;assert.equal(now.y,old.y+9);now.y=old.y;now.scale=old.scale;}if(old.assetId==='env:rock'){assert.equal(now.y,old.y+6);now.y=old.y;now.rotation=old.rotation;}assert.deepEqual(now,old,'Only explicit scenic asset/grounding edits '+old.id);}
const act4=clone(s.design.act4);act4.palette=original.design.act4.palette;assert.deepEqual(act4,original.design.act4);
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
const before=g.HonroMaps.createBattle(original,{...p,stages:[original]},profile),after=g.HonroMaps.createBattle(s,p,profile);assert.deepEqual(JSON.parse(JSON.stringify(after.terrain)),JSON.parse(JSON.stringify(before.terrain)),'Actual compiled collision parity');
await writeFile(`${dir}/${process.argv.includes('--body-only')?'body-candidate':'candidate'}-project.json`,JSON.stringify(p));console.log('Stage33 candidate assembled; exact official source/gameplay and compiled collision preserved. Art review pending.');

if(!process.argv.includes('--body-only')){const packageDir=dir+'/package';await mkdir(packageDir,{recursive:true});await writeFile(packageDir+'/stage.json',JSON.stringify(s));await writeFile(packageDir+'/library.json',JSON.stringify(p.library.filter(a=>a.id.startsWith('s33v:'))));await writeFile(packageDir+'/optimization.json',JSON.stringify(optimization,null,2));await writeFile(packageDir+'/manifest.json',JSON.stringify({stageId:s.id,status:'candidate-not-user-approved',projectSha256:createHash('sha256').update(JSON.stringify(p)).digest('hex'),geometryUnchanged:true,source:'shared/data/act4/world.json',dependencies:['shared/runtime/vector.js internal symbols and pixelSnapClip','tools/vector-production/extend-body-domain.mjs','art/vector-common-production/reed-cluster-asset.json','art/vector-common-production/coastal-boulder-raw.svg','art/vector-common-production/abandoned-skiff-raw.svg','shared/map/terrain-domain.js opt-in grounded inward water taper8fe1db7','art/stage33-vector-production/stone-pier-raw.svg'],preserved:'All official collision, units, tide/water policies, events and mission conditions',scenicFit,pierFit,notes:'Scoped portable visual assets. No browser/device or deployment claim.'},null,2));}
