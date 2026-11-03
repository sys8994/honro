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
 const source=read('continuous-runtime.json'),pier=read('pier-runtime-preview.json'),westPier=read('pier-west-five-runtime.json'),eastPier=read('pier-east-five-runtime.json');
 const contour=road.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';
 // A single source-traced, full-bleed formation covers the complete tested
 // camera domain. The collision contour alone determines the visible edge.
 const ext={x:-4000,y:1500,w:14600,h:5500};
 const body={...source,id:'stage06-prototype:continuous-body-v1',name:'Stage6 continuous traced BODY study',bounds:ext,reference:{...source.reference,bounds:ext,foot:{x:0,y:3800},heightM:86.6666666667},params:{...source.params,collisionSource:'lower-road',prototypeGeometrySha256:expected,previewOnly:true},vector:{version:1,viewBox:[ext.x,ext.y,ext.w,ext.h],clips:{road:[contour]},root:{tag:'g',clipPath:'road',children:[{tag:'path',d:contour,fill:'#364441'},{tag:'g',transform:[14600/source.vector.viewBox[2],0,0,5500/source.vector.viewBox[3],-4000,1500],children:[clone(source.vector.root)]}]}}};
 project.library.push(body);s.elements.push({id:'stage06-prototype-body',assetId:body.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 // One traced support per broken span. Foot and socket are explicitly registered
 // to the physical floor/deck; these are art only and do not add collision.
 for(const [id,x,deck,mirror] of [['west',2000,1875,false],['mid',3150,1830,false],['east',4520,1948,false]]){
  const art=id==='west'?westPier:id==='east'?eastPier:pier, width=id==='west'?887:1024,height=id==='west'?1774:1536,top=id==='west'?225:50,bottom=id==='west'?1705:1500;
  const ground=floor(x),scale=(ground-deck)/(bottom-top),sx=mirror?-scale:scale,tx=x-sx*width/2,ty=deck-top*scale,asset=clone(art);
  asset.id='stage06-prototype:pier-'+id;asset.name='Stage6 '+id+' unshipped pier study';asset.bounds={x:mirror?tx-width*scale:tx,y:ty,w:width*scale,h:height*scale};asset.reference={...asset.reference,bounds:asset.bounds,foot:{x,y:ground}};asset.anchor={x:0,y:0};asset.vector.viewBox=[asset.bounds.x,asset.bounds.y,asset.bounds.w,asset.bounds.h];asset.vector.root={tag:'g',transform:[sx,0,0,scale,tx,ty],children:[clone(art.vector.root)]};asset.params={...asset.params,previewOnly:true,deckY:deck,groundY:ground};
  project.library.push(asset);s.elements.push({id:'stage06-prototype-pier-'+id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 }
 return project;
}
