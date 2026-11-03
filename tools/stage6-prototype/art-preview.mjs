/** Explicit non-production composition study. Collision stays in author.mjs.
 * This is a review candidate, not an acceptance or production art source. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {authorStage6Prototype,floor} from './author.mjs';
const read=name=>JSON.parse(readFileSync(new URL('./art-study/'+name,import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
const expected='1c3f1f1825e39cabf653688ed779dcc42d80ce448e4e582173a8eb53cbb80870';
const hash=createHash('sha256').update(readFileSync(new URL('./author.mjs',import.meta.url))).digest('hex');
if(hash!==expected)throw Error('Stage6 prototype geometry changed: preview art requires new review');
function oldFloor(t,x){const p=t.points;for(let i=1;i<p.length;i++){const a=p[i-1],b=p[i];if(b.x>a.x&&x>=a.x&&x<=b.x)return a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)}throw Error('No old support for '+x)}
export function applyStage6ArtPreview(input){
 const previous=input.stages.find(s=>s.metadata?.stageId===6),oldRoad=previous.terrains.find(t=>t.id==='lower-road');
 const project=authorStage6Prototype(input),s=project.stages.find(s=>s.metadata?.stageId===6),road=s.terrains.find(t=>t.id==='lower-road');
 const rootIds=['landmark-2','landmark-3','place6-west-scree','place6-mid-debris','place6-east-pine','place6-east-scree','a1-scene-6-transport-shelter','a1-scene-6-exit-grove-west','a1-scene-6-exit-grove-center','a1-scene-6-exit-grove-east'];
 for(const e of s.elements)if(rootIds.includes(e.id))e.y+=floor(e.x)-oldFloor(oldRoad,e.x);
 // Remove old BODY and central pier illustration, whose placements describe the old floor.
 s.elements=s.elements.filter(e=>!['act1-stage06-traced-body','landmark-1','place6-west-buttress','place6-mid-buttress','place6-east-buttress','place6-bridge-rigging'].includes(e.id));
 const west=read('west-matched-runtime.json'),middle=read('middle-grounded-runtime.json'),east=read('east-grounded-runtime.json'),pier=read('pier-runtime-preview.json');
 const contour=road.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';
 const ext={x:-4000,y:1500,w:14600,h:5200};
 // Each section is an independent source-traced formation, registered to the
 // geometry-guide's world-coordinate rectangle; seam clips are visual only.
 const sections=[{zone:'westZone',transform:[2500/1642,0,0,1850/958,0,1650],art:west.vector.root},{zone:'middleZone',transform:[2400/1642,0,0,2150/958,2100,1650],art:middle.vector.root},{zone:'eastZone',transform:[2600/1642,0,0,2050/958,4000,1750],art:east.vector.root}];
 const zones={road:[contour],westZone:['M-4000 0H2300V10000H-4000Z'],middleZone:['M2300 0H4300V10000H2300Z'],eastZone:['M4300 0H10600V10000H4300Z']};
 const body={...west,id:'stage06-prototype:assembled-body-v1',name:'Stage6 unshipped traced BODY study',bounds:ext,reference:{...west.reference,bounds:ext,foot:{x:0,y:3800},heightM:86.6666666667},params:{...west.params,collisionSource:'lower-road',prototypeGeometrySha256:expected,previewOnly:true},vector:{version:1,viewBox:[ext.x,ext.y,ext.w,ext.h],clips:zones,root:{tag:'g',clipPath:'road',children:[{tag:'path',d:contour,fill:'#2e3c39'},...sections.map(z=>({tag:'g',clipPath:z.zone,children:[{tag:'g',transform:z.transform,children:[clone(z.art)]}]}))]}}};
 project.library.push(body);s.elements.push({id:'stage06-prototype-body',assetId:body.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 // One traced support per broken span. Foot and socket are explicitly registered
 // to the physical floor/deck; these are art only and do not add collision.
 for(const [id,x,deck,mirror] of [['west',2000,1875,false],['mid',3150,1830,false],['east',4520,1948,true]]){
  const ground=floor(x),scale=(ground-deck)/(1500-50),sx=mirror?-scale:scale,tx=x-sx*512,ty=deck-50*scale,asset=clone(pier);
  asset.id='stage06-prototype:pier-'+id;asset.name='Stage6 '+id+' unshipped pier study';asset.bounds={x:mirror?tx-1024*scale:tx,y:ty,w:1024*scale,h:1536*scale};asset.reference={...asset.reference,bounds:asset.bounds,foot:{x,y:ground}};asset.anchor={x:0,y:0};asset.vector.viewBox=[asset.bounds.x,asset.bounds.y,asset.bounds.w,asset.bounds.h];asset.vector.root={tag:'g',transform:[sx,0,0,scale,tx,ty],children:[clone(pier.vector.root)]};asset.params={...asset.params,previewOnly:true,deckY:deck,groundY:ground};
  project.library.push(asset);s.elements.push({id:'stage06-prototype-pier-'+id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,layer:'back',depthLayer:'L1',visualRole:'scenery'});
 }
 return project;
}
