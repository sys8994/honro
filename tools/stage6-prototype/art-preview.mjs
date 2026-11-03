/** Explicit non-production composition study. Collision stays in author.mjs.
 * This is a review candidate, not an acceptance or production art source. */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {authorStage6Prototype,floor} from './author.mjs';
const read=name=>JSON.parse(readFileSync(new URL('./art-study/'+name,import.meta.url),'utf8'));
const clone=x=>structuredClone(x);
// Preblend individual opaque fills; vector v1 intentionally forbids group opacity.
function subdued(root){const out=clone(root),base=[54,68,65];function visit(n){if(typeof n.fill==='string'&&/^#[0-9a-f]{6}$/i.test(n.fill)){const rgb=n.fill.slice(1).match(/../g).map(x=>parseInt(x,16));n.fill='#'+rgb.map((v,i)=>Math.round(base[i]+(v-base[i])*0.26).toString(16).padStart(2,'0')).join('')}for(const c of n.children||[])visit(c)}visit(out);return out}

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
 const strata=read('terrain-connected-runtime.json'),panorama=read('terrain-panorama2-runtime.json'),slope=read('terrain-slope-runtime.json'),exposure=read('terrain-exposure-runtime.json'),lowerExposure=read('terrain-lower-exposure-runtime.json'),eastExposure=read('terrain-east-exposure-runtime.json'),east=read('terrain-east-runtime.json'),source=read('continuous-runtime.json'),pier=read('pier-runtime-preview.json'),westPier=read('pier-west-five-runtime.json'),eastPier=read('pier-east-five-runtime.json');
 const contour=road.points.map((p,i)=>(i?'L':'M')+p.x+' '+p.y).join('')+'Z';
 // A single source-traced, full-bleed formation covers the complete tested
 // camera domain. The collision contour alone determines the visible edge.
 const ext={x:-4000,y:1500,w:14600,h:5500};
 // Per-color radial alpha feathers the independently traced local formation into the full-domain traced rock, without changing physical contours.
 const gradients={};let gradientIndex=0;function feather(n,cx=740,cy=300,r=650){if(n.tag==='path'&&/^#[0-9a-f]{6}$/i.test(n.fill||'')){const color=n.fill,id='slopefade'+gradientIndex++;gradients[id]={type:'radial',cx,cy,r,stops:[{offset:0,color,opacity:1},{offset:.48,color,opacity:1},{offset:.7,color,opacity:.55},{offset:1,color,opacity:0}]};n.fill='url(#'+id+')'}for(const c of n.children||[])feather(c,cx,cy,r)}const slopeRoot=clone(slope.vector.root);feather(slopeRoot);const eastRoot=clone(east.vector.root);feather(eastRoot,1050,400,550);const panoramaRoot=clone(panorama.vector.root);feather(panoramaRoot,396.5,175,350);
 const body={...source,id:'stage06-prototype:continuous-body-v1',name:'Stage6 continuous traced BODY study',bounds:ext,reference:{...source.reference,bounds:ext,foot:{x:0,y:3800},heightM:86.6666666667},params:{...source.params,collisionSource:'lower-road',prototypeGeometrySha256:expected,previewOnly:true},vector:{version:1,viewBox:[ext.x,ext.y,ext.w,ext.h],clips:{road:[contour]},gradients,root:{tag:'g',clipPath:'road',children:[{tag:'path',d:contour,fill:'#364441'},{tag:'g',transform:[14600/836,0,0,14600/836,-4000,1500],children:[subdued(strata.vector.root)]},{tag:'g',transform:[8.652,0,0,8.652,-129,519],children:[panoramaRoot]}]}}};
 project.library.push(body);s.elements.push({id:'stage06-prototype-body',assetId:body.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 // Clip support art to the air above the same physical top edge. This trims
 // broad stone footings to the slope without changing collisions or draw order.
 const tops=road.points.filter(p=>p.x>=0&&p.x<=6600&&p.y<4000).sort((a,b)=>a.x-b.x);
 const sky=`M-4000 -10000H10600V${tops.at(-1).y}`+tops.slice().reverse().map(p=>`L${p.x} ${p.y}`).join('')+`L-4000 ${tops[0].y}Z`;
 // One traced support per broken span. Foot and socket are explicitly registered
 // to the physical floor/deck; these are art only and do not add collision.
 for(const [id,x,deck,mirror] of [['west',2000,1875,false],['mid',3150,1830,false],['east',4520,1948,false]]){
  const art=id==='west'?westPier:id==='east'?eastPier:pier, width=id==='west'?887:1024,height=id==='west'?1774:1536,top=id==='west'?225:50,bottom=id==='west'?1705:1500;
  const ground=floor(x),scale=(ground-deck)/(bottom-top),sx=mirror?-scale:scale,tx=x-sx*width/2,ty=deck-top*scale,asset=clone(art);
  asset.id='stage06-prototype:pier-'+id;asset.name='Stage6 '+id+' unshipped pier study';asset.bounds={x:mirror?tx-width*scale:tx,y:ty,w:width*scale,h:height*scale};asset.reference={...asset.reference,bounds:asset.bounds,foot:{x,y:ground}};asset.anchor={x:0,y:0};asset.vector.viewBox=[asset.bounds.x,asset.bounds.y,asset.bounds.w,asset.bounds.h];const slope=(floor(x+1)-floor(x-1))/2,baseStart=id==='west'?1500:1300;
  asset.vector.clips={...asset.vector.clips,aboveRoad:[sky],sourceFoot:[`M0 ${baseStart}H${width}V${height}H0Z`]};
  // Overlay an additional copy of the source-traced stone base, sheared to the
  // local road slope. Its upper timber remains unwarped; exact road clips both.
  // Internal use references retain one exact source path tree while drawing
  // it twice; validator budgets count the expanded form, not just storage.
  if(Object.keys(art.vector.symbols||{}).length)throw Error('Unexpected nested support symbols');
  asset.vector.symbols={sourceArt:clone(art.vector.root)};
  asset.vector.root={tag:'g',clipPath:'aboveRoad',children:[{tag:'g',transform:[sx,0,0,scale,tx,ty],children:[{tag:'use',symbol:'sourceArt'}]},{tag:'g',transform:[sx,slope*sx,0,scale,tx,ty-slope*sx*width/2],children:[{tag:'g',clipPath:'sourceFoot',children:[{tag:'use',symbol:'sourceArt'}]}]}]};asset.params={...asset.params,previewOnly:true,deckY:deck,groundY:ground};
  project.library.push(asset);s.elements.push({id:'stage06-prototype-pier-'+id,assetId:asset.id,x:0,y:0,scale:1,rotation:0,layer:'prop',depthLayer:'L1',visualRole:'scenery'});
 }
 return project;
}
