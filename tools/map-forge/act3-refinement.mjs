/** Authored scenic vignettes. Contact, contour and occupation guide the art;
 * these editable SVGs add no collision or synthetic walking platforms. */
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {asset,put,P,line,R,settle} from './act3-map-kit.mjs';
import {act3Pine} from '../environment/act3-pine-art.mjs';
const at=(q,x)=>{for(let i=1;i<q.length;i++)if(x<=q[i][0]){const a=q[i-1],z=q[i];return a[1]+(z[1]-a[1])*(x-a[0])/(z[0]-a[0]);}return q.at(-1)[1];};
const path=(d,fill)=>`<path d="${d}" fill="${fill}"/>`;
const pineSites={21:[[80,.57],[3740,.65],[6080,.72]],22:[[180,.65],[5350,.48]],23:[],24:[[650,.62],[1130,.80],[3570,.7],[4700,.87],[6960,.65]],25:[[95,.68],[735,.55],[5590,.73]],26:[[90,.68],[2050,.45],[5850,.64],[6680,.71]],27:[[60,.68],[2800,.56],[6840,.65]],28:[[80,.8],[850,.7],[1230,.6],[3290,.86],[3700,.57],[4760,.63],[5470,.81],[6970,.65]],29:[[230,.61],[900,.7],[6250,.62],[7070,.8]],30:[[45,.64],[550,.6],[2190,.67],[3520,.63],[6860,.6]]};
// Unequal groups occupy selected shoulders; open work and gathering circles stay clear.
const vignettes={21:[470,3550,5610],22:[260,5400],23:[370,3130,5760,7000],24:[390,3380,4590,6770],25:[340,1120,4350,5450],26:[790,2130,4050,6000,6610],27:[620,2910,4640,6750],28:[370,1150,3460,5140,6810],29:[650,1360,5440,6470],30:[430,1960,3360,5200,6760]};
const shoulders={24:[[600,260,18],[3600,350,-24],[4380,200,16],[6900,240,-18]],25:[[200,170,12],[1020,180,-18],[5160,180,-16]],26:[[430,290,20],[2140,180,20],[6350,280,-25]],27:[[1460,130,-18],[3100,180,18],[6400,100,-16]],28:[[450,250,-22],[1080,180,15],[3600,180,-20],[4980,240,-25],[7180,160,18]],29:[[500,220,-18],[1440,170,16],[6250,160,-18],[7050,120,-10]],30:[[430,260,-20],[1960,190,18],[3360,200,-15],[6860,150,-18]]};
function weatherContour(base,id){const patches=shoulders[id]||[],xs=new Set(base.map(v=>v[0]));for(const [x,r]of patches)for(let k=-4;k<=4;k++)xs.add(x+r*k/4);
 return [...xs].filter(x=>x>=0&&x<=base.at(-1)[0]).sort((a,b)=>a-b).map(x=>[x,at(base,x)+patches.reduce((n,[center,r,depth])=>{const d=Math.abs(x-center)/r;return n+(d<1?depth*(1+Math.cos(d*Math.PI))/2:0);},0)]);
}
function add(p,s,id,svg,bounds,layer='back',category='rock'){
 const a=asset(`a3-refine:${s.metadata.stageId}:${id}`,id,svg,[],bounds,'stone');a.category=category;a.params.rearOnly=layer==='back';a.tags=['act3-production','act3-refinement'];put(p,s,a,a.id,0,0,1,layer);return a;
}
function rock(x,y,w,h){return path(`M${x-w*.52} ${y}Q${x-w*.43} ${y-h*.46} ${x-w*.34} ${y-h*.73}L${x-w*.10} ${y-h}Q${x+w*.19} ${y-h*.93} ${x+w*.42} ${y-h*.62}L${x+w*.53} ${y-7}Q${x+w*.14} ${y+5} ${x-w*.52} ${y}Z`,'#384e48')+path(`M${x-w*.34} ${y-h*.73}L${x-w*.1} ${y-h}Q${x+w*.14} ${y-h*.93} ${x+w*.25} ${y-h*.76}L${x+w*.05} ${y-h*.31} ${x-w*.18} ${y-h*.15}Z`,'#78816a')+path(`M${x+w*.25} ${y-h*.76}L${x+w*.42} ${y-h*.62} ${x+w*.53} ${y-7} ${x+w*.05} ${y-3} ${x+w*.05} ${y-h*.31}Z`,'#516254');}
function reed(x,y,sign=1){let svg='';for(const [dx,h,bend]of [[-25,49,-18],[-9,78,-22],[10,59,22],[22,94,27]]){svg+=`<path d="M${x+dx} ${y}Q${x+dx+sign*bend*.4} ${y-h*.62} ${x+dx+sign*bend} ${y-h}" fill="none" stroke="#8c9370" stroke-width="3"/>`+path(`M${x+dx+sign*bend} ${y-h}Q${x+dx+sign*bend-8} ${y-h-16} ${x+dx+sign*bend+2} ${y-h-28}Q${x+dx+sign*bend+9} ${y-h-13} ${x+dx+sign*bend} ${y-h}Z`,'#ac9b72');}return svg;}
function stoneLantern(x,y){return path(`M${x-36} ${y}L${x-29} ${y-13} ${x-13} ${y-16} ${x-12} ${y-66} ${x-28} ${y-69} ${x-31} ${y-77} ${x-5} ${y-93} ${x+1} ${y-99} ${x+8} ${y-92} ${x+35} ${y-78} ${x+33} ${y-70} ${x+15} ${y-66} ${x+14} ${y-16} ${x+29} ${y-13} ${x+38} ${y}Z`,'#58675b')+R(x-7,y-62,14,27,'#1e3334')+P([[x-25,y-76],[x-3,y-90],[x+24,y-76]],'#89917a')+R(x-13,y-14,27,5,'#89917a');}
export function refineStage(p,s){const id=s.metadata.stageId;if(id<21||id>30)return s;
 const prefix=`a3-refine:${id}:`;s.elements=s.elements.filter(e=>!e.id.startsWith(prefix));p.library=p.library.filter(a=>!a.id.startsWith(prefix));
 const ridge=s.environment.placements.filter(e=>e.assetId.endsWith(':far-ridge')).map(e=>e.assetId);s.environment.placements=s.environment.placements.filter(e=>!ridge.includes(e.assetId));
 // The former oversized plain ridge is superseded by the common SKY panorama.
 s.environment.groups=s.environment.groups.filter(g=>g.id!=='a3-place-L4');s.environment.surfaces=s.environment.surfaces.filter(q=>q.groupId!=='a3-place-L4');
 let q=s.design.act3.primaryContour||s.design.act3.requiredRoute.map(v=>[v.x,v.y]);
 const floor=s.terrains.find(t=>t.id==='a3-foundation'||t.id==='archive-foundation'),physical=[];
 for(const v of floor?.points||[]){if(physical.length&&v.x<physical.at(-1)[0])break;if(v.x>=0&&v.x<=s.width&&v.y<s.height-80)physical.push([v.x,v.y]);}
 const baseFloor=s.design.act3.refinement?.baseFloor||physical;
 let fq=physical.length>1?physical:q;
 if(shoulders[id]&&floor&&baseFloor.length>1){const oldEnd=floor.points.findIndex(v=>v.x>=s.width),tail=floor.points.slice(oldEnd+1);fq=weatherContour(baseFloor,id);floor.points=[...fq.map(([x,y])=>({x,y})),...tail];
  // Smooth small shoulders are real terrain, not an independent painted rim.
  // Bridges, work circles and the main route remain at their authored levels.
  if(s.design.act3.primaryContour)q=weatherContour(s.design.act3.primaryContour,id);
 }
 // Three broad earth/stone washes below the true contour, with irregular
 // weathered returns. No grid, repeated cracks, or altered approved outline.
 let washes='';for(const [i,x]of (vignettes[id]||[]).entries()){const w=[410,630,350,520,460][i%5],yy=at(fq,x),xx=Math.max(0,x-w/2),end=Math.min(s.width,x+w/2),ys=at(fq,xx),ye=at(fq,end),color=id===26||id===27?'#514e3c':id>=29?'#304b49':'#485f4e';
  const top=[[xx,ys+10],...fq.filter(v=>v[0]>xx&&v[0]<end).map(([a,b])=>[a,b+10]),[end,ye+10]];
  washes+=P([...top,[end-36,ye+75],[x+w*.16,yy+124],[x-38,yy+88],[xx+12,ys+62]],color)+path(`M${x-42} ${yy+100}Q${x+52} ${yy+78} ${end-36} ${ye+85}L${end-59} ${ye+117}Q${x+48} ${yy+137} ${x-56} ${yy+150}Z`,id>=29?'#203c3d':'#31493f');
 }
 add(p,s,'weathered-ground-washes',washes,[0,Math.min(...fq.map(v=>v[1])),s.width,700],'prop');
 for(const [i,x]of (vignettes[id]||[]).entries()){const y=at(id===22?fq:q,x),w=80+[48,5,26,67,12][i%5],h=45+[27,62,14,39,18][i%5];let art=path(`M${x-94} ${y-2}Q${x-24} ${y-15} ${x+94} ${y-1}Q${x+26} ${y+9} ${x-94} ${y-2}Z`,'#233b36')+rock(x,y,w,h)+rock(x+w*.53,y+3,w*.37,h*.31);
  if(id!==22&&id!==25)art+=reed(x-w*.65,y,i%2?-1:1);
  if([24,25,28,29].includes(id)&&i===0)art+=stoneLantern(x+90,y);
  if(id===23)art+=R(x+83,y-41,61,40,'#77654c')+R(x+88,y-37,51,7,'#a59168')+line([[x+113,y-40],[x+113,y]],'#423f31',5);
  if(id===26){art+=path(`M${x+32} ${y}L${x+16} ${y-46} ${x+53} ${y-66} ${x+83} ${y-41} ${x+80} ${y}Z`,'#4d4438')+path(`M${x+36} ${y-45}L${x+52} ${y-56} ${x+71} ${y-40} ${x+66} ${y-11} ${x+43} ${y-8}Z`,'#7c6d50');}
  add(p,s,'ground-vignette-'+i,art,[x-170,y-150,380,175]);
 }
 for(const [i,[x,scale]]of (pineSites[id]||[]).entries()){const y=at(id===22?fq:q,x);if(![26,27].includes(id)){const tree=act3Pine(prefix+'pine-art-'+i,i+id);tree.params.rearOnly=true;put(p,s,tree,prefix+'rooted-pine-'+i,x,y,scale,'back');}
  else {const h=235*scale;add(p,s,'burnt-trunk-'+i,path(`M${x-14} ${y}Q${x-6} ${y-h*.5} ${x-16} ${y-h}L${x-9} ${y-h-15} ${x+7} ${y-h*.72} ${x+43} ${y-h*.8} ${x+78} ${y-h*.75} ${x+47} ${y-h*.74} ${x+11} ${y-h*.65}Q${x+20} ${y-h*.30} ${x+13} ${y}Z`,'#2c3932')+line([[x-6,y-8],[x-3,y-h*.45],[x-10,y-h*.78]],'#77674b',5),[x-25,y-h-20,120,h+25]);}
 }
 // Place-specific low architecture frames open ground without turning it into
 // a second set of gameplay platforms.
 if([24,28].includes(id)){let svg='';for(const [x,len]of id===24?[[3650,360],[6650,230]]:[[880,250],[4870,360]]){const y=at(q,x);svg+=P([[x,y],[x+len,y],[x+len-16,y-43],[x+len*.6,y-67],[x+len*.31,y-52],[x+12,y-70]],'#536757')+line([[x+8,y-70],[x+len*.31,y-52],[x+len*.6,y-67],[x+len-16,y-43]],'#929982',7)+rock(x+len*.7,y,70,56);}add(p,s,'broken-garden-boundary',svg,[700,1900,s.width-700,1050]);}
 s.initialState.honroAct3SceneryRevision=1;s.design.act3.refinement={version:1,panorama:'act3-far.svg',vignettes:vignettes[id].length,groundedTrees:pineSites[id].length,baseFloor,shoulders:(shoulders[id]||[]).length,scope:'Editable grounded SVG art; small sampled real terrain shoulders with work/bridge levels preserved.'};return s;
}
export function refineProject(p,g){for(const s of p.stages){refineStage(p,s);if(g&&s.metadata.stageId>=21)settle(g,p,s);}const used=new Set(p.stages.flatMap(s=>[...s.elements,...s.environment.placements].map(e=>e.assetId)));p.library=p.library.filter(a=>!a.id.endsWith(':far-ridge')||used.has(a.id));return p;}
if(process.argv[1]===fileURLToPath(import.meta.url)){const {runtime}=await import('../../game/tests/helpers.mjs'),g=await runtime({legacyMaps:false}),p=JSON.parse(await readFile('shared/data/campaign.json','utf8'));refineProject(p,g);const {applyEncounters}=await import('./act3-encounters.mjs');applyEncounters(g,p);await writeFile('shared/data/campaign.json',JSON.stringify(g.HonroMaps.finalize(p),null,2)+'\n');}
