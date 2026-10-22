/** Stage11 authored material data. No terrain, actor, objective or shared asset edits. */
import {authorStage11Fractures} from './stage11-fracture-fields.mjs';
import {compileSVG} from './build-act2-art.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const round=x=>Math.round(x*100)/100;
const nodeCount=n=>1+(n.children||[]).reduce((sum,c)=>sum+nodeCount(c),0);
// Geology has a direction across the whole landform. Stations are deliberately
// unequal; bed changes describe inclined slabs rather than tiled boulders.
const profiles={
 'act2-floor':{cuts:[0,.17,.39,.66,1],beds:[.13,.35,.63],dip:.18},
 'rv-west-shoulder':{cuts:[0,.24,.61,1],beds:[.19,.46,.73],dip:-.13},
 'rv-west-stone-arch':{cuts:[0,.43,1],beds:[.28,.68],dip:.23},
 'rv-west-rock-crown':{cuts:[0,.38,.72,1],beds:[.23,.54,.79],dip:.16},
 'rv-ritual-buttress':{cuts:[0,.19,.52,.81,1],beds:[.18,.43,.76],dip:.24},
 'rv-lower-west-shelf':{cuts:[0,.32,.71,1],beds:[.16,.39,.69],dip:-.17},
 'rv-lower-refuge-rock':{cuts:[0,.23,.57,.83,1],beds:[.17,.42,.68,.86],dip:.14},
 'rv-east-tower':{cuts:[0,.29,.65,1],beds:[.22,.48,.78],dip:-.17},
 'rv-north-trace':{cuts:[0,.12,.29,.52,.77,1],beds:[.14,.36,.61,.83],dip:.29}
};
// Scenery's shared style intentionally drops contour strokes. Author poles,
// ropes and basket weave as filled ribbons so their material survives it.
function ribbon(d,color,width){
 const tok=d.match(/[MLQZ]|[-+]?(?:\d*\.)?\d+/g),runs=[];let run=[],x=0,y=0,i=0,cmd='M';
 const flush=()=>{if(run.length>1)runs.push(run);run=[];};
 while(i<tok.length){if(/[MLQZ]/.test(tok[i]))cmd=tok[i++];if(cmd==='Z'){flush();continue;}if(cmd==='M'||cmd==='L'){x=+tok[i++];y=+tok[i++];if(cmd==='M'){flush();cmd='L';}run.push([x,y]);}else if(cmd==='Q'){const cx=+tok[i++],cy=+tok[i++],ex=+tok[i++],ey=+tok[i++],sx=x,sy=y;for(let n=1;n<=8;n++){const u=n/8;run.push([(1-u)**2*sx+2*(1-u)*u*cx+u*u*ex,(1-u)**2*sy+2*(1-u)*u*cy+u*u*ey]);}x=ex;y=ey;}}flush();
 return runs.map(ps=>{const side=sgn=>ps.map(([x,y],i)=>{const a=ps[Math.max(0,i-1)],b=ps[Math.min(ps.length-1,i+1)],len=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[round(x-(b[1]-a[1])/len*width/2*sgn),round(y+(b[0]-a[0])/len*width/2*sgn)];}),pts=[...side(1),...side(-1).reverse()];return`<path d="M${pts.map(p=>p.join(' ')).join('L')}Z" fill="${color}"/>`;}).join('');
}
const path=(d,fill,stroke='',width=1)=>fill==='none'?ribbon(d,stroke,width):`<path d="${d}" fill="${fill}"/>`;
function shelterAsset(old){
 // The resident stands west of this footprint. A drooping fabric silhouette,
 // slant poles and an open front deliberately avoid a horizontal platform cue.
 let svg=path('M-77 11L75 -17 290 -62 451 -87 479 -71 307 -41 91 7-60 31Z','#334841');
 svg+=path('M-51 1L109 -24 296 -64 352 -58 194 -16 42 19Z','#8c8865');
 svg+=path('M-57 -12L-42 -151 125 -228 362 -217 430 -85 349 -129 222 -143 110 -91Z','#374b43','#263b35',7);
 svg+=path('M-46 -150L125 -228 362 -217 307 -180 204 -170 104 -115-57 -12Z','#9f9670');
 svg+=path('M125 -228L188 -179 307 -180 362 -217 314 -193 211 -188Z','#beb18a');
 svg+=path('M-46 -150L104 -115 204 -170 187 -148 100 -94-57 -12Z','#6e7557');
 svg+=path('M-45 9L-44 -151M423 -81L362 -217','none','#493f31',12);
 svg+=path('M-48 4L-48 -150M420 -83L358 -211','none','#aa9368',4);
 svg+=path('M-44 -151L-84 9M362 -217L472 -91','none','#b2a37b',3);
 // Rolled bedding with a visible end, split bamboo basket, lidded water jar.
 svg+=path('M39 -3L132 -27 146 -67 52 -42Z','#6d7868','#354d43',5);
 svg+=path('M52 -42Q32 -45 29 -22Q28 -3 44 -3L58 -7Q68 -23 52 -42Z','#b2ac87','#44584c',4);
 svg+=path('M46 -31Q36 -18 48 -12M57 -39L134 -60','none','#67765e',4);
 svg+=path('M180 -32L169 -96Q196 -119 237 -108L253 -48Q225 -28 180 -32Z','#9f885d','#3e4d3b',5);
 svg+=path('M173 -95Q200 -78 238 -108M176 -76L243 -78M180 -54L249 -59M190 -103L199 -34M216 -108L225 -37','none','#c1ae7c',4);
 svg+=path('M293 -64Q275 -109 295 -135L321 -140Q345 -123 342 -88L331 -70Z','#455b58','#2c4440',5);
 svg+=path('M291 -129L325 -135 328 -143 294 -139Z','#a59b78');
 svg+=path('M295 -119Q284 -97 300 -81','none','#7c8e7d',5);
 svg+=path('M73 -3L159 -21 166 -11 85 8Z','#474e3c');
 svg+=path('M88 -3L153 -16M95 3L160 -10','none','#b0a47e',3);
 const vector=compileSVG(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -250 600 300">${svg}</svg>`);
 return{...old,name:'주민 암대의 천막과 자리·광주리·물동이',vector,bounds:{x:-100,y:-250,w:600,h:300},reference:{...old.reference,heightM:5,bounds:{x:-100,y:-250,w:600,h:300}},params:{...old.params,artRevision:2,nodeCount:nodeCount(vector.root)},collision:[]};
}
export function applyStage11VectorFinish(project){
 const st=project.stages.find(s=>s.metadata?.stageId===11),materials=[];
 for(const t of st.terrains){
  const spec=profiles[t.id];if(!spec)continue;
  const ps=t.points,lo=Math.min(...ps.map(p=>p.x)),hi=Math.max(...ps.map(p=>p.x)),w=hi-lo;
  const edges=t.id==='act2-floor'?ps.flatMap((p,i)=>{const q=ps[(i+1)%ps.length];return q.x>p.x&&Math.abs((q.y-p.y)/(q.x-p.x))<2?[[p,q]]:[];}):t.properties.honroWalkEdges.map(i=>[ps[i],ps[i+1]]);
  const top=x=>{const e=edges.find(([a,b])=>x>=a.x-.01&&x<=b.x+.01)||edges.at(-1);return e[0].y+(e[1].y-e[0].y)*(x-e[0].x)/(e[1].x-e[0].x||1);};
  const bottom=x=>Math.max(top(x)+50,...ps.flatMap((a,i)=>{const b=ps[(i+1)%ps.length];return Math.abs(a.x-b.x)>.01&&x>=Math.min(a.x,b.x)&&x<=Math.max(a.x,b.x)?[a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x)]:[];}));
  const at=(u,v)=>{const x=lo+w*u,y=top(x),d=Math.min(t.id==='act2-floor'?3400:10000,bottom(x)-y);return[round(x),round(y+d*v)];};
  const faces=[],add=(pts,fill)=>faces.push({points:pts.map(p=>at(...p)),fill});
  // Full-depth connected light/side planes; no separate stone outlines.
  const tones=['#819285','#647e79','#49696c','#6f8580','#3d5b62'];
  spec.cuts.slice(0,-1).forEach((u,i)=>{const z=spec.cuts[i+1],span=z-u,offset=span*(i%2?.11:-.09);add([[u,0],[z,0],[z+offset,.34],[z-span*.12,.72],[z+span*.09,1.12],[u-span*.10,1.12],[u+span*.12,.67],[u+offset,.29]],tones[(i+(t.id.length%3))%tones.length]);});
  // Partial, inclined strata belong to broad slabs. The stations create
  // unequal weathering breaks; there is no repeated all-width stripe.
  const bedSpans=[[.015,.63],[.26,.98],[.06,.76],[.47,1]];
  spec.beds.forEach((v,i)=>{
   const span=bedSpans[(i+t.id.length)%4],u0=span[0],u1=span[1],length=u1-u0;
   const ridge=[0,.23,.57,.83,1].map((u,k)=>[u0+length*u,v+spec.dip*(u-.5)+[.018,-.045,.022,-.016,.05][(k+i)%5]]);
   const depth=[.17,.21,.15,.19][i],lower=ridge.map(([u,d],k)=>[u+length*[.025,.018,-.035,-.055,-.10][k],d+depth*[.16,.93,1,.66,.14][k]]);
   add([...ridge,...lower.slice().reverse()],['#849789','#6a847c','#748c80','#566f6b'][i]);
   const lip=lower.slice(1,4);add([...lip,...lip.slice().reverse().map(([u,d],k)=>[u+.008,d+.012+k*.004])],i%2?'#37535a':'#435f61');
   if(i===0){const rim=ridge.slice(1,3);add([...rim,...rim.slice().reverse().map(([u,d])=>[u,d+.010])],'#a2ac9580');}
  });
  // Narrow deep clefts scale in world units. Their broken, tapering branches
  // connect the major faces without outlining each slab like a diagram.
  spec.cuts.slice(1,-1).forEach((u,i)=>{
   const d=(i%2?1:-1)*.031,thick=Math.min(.008,21/w);
   add([[u-thick,.015],[u+thick,.025],[u+d,.25],[u+d*.3,.51],[u+d*1.6,.79],[u+d,1.06],[u+d-thick,1.06],[u+d*1.6-thick*2,.79],[u+d*.3-thick*2,.51],[u+d-thick*2,.25]],'#263f49');
   add([[u-thick*2,.06],[u-thick,.06],[u+d-thick*2,.25],[u+d*.3-thick*3,.5],[u+d*.3-thick*4,.5],[u+d-thick*3,.25]],'#95a18b66');
   const side=i%2?-.12:.13;
   add([[u+d*.3,.51],[u+d*.3+side*.42,.54],[u+d*.3+side,.49],[u+d*.3+side,.50],[u+d*.3+side*.42,.558],[u+d*.3-thick,.527]],'#304d54');
  });
  materials.push({terrainId:t.id,faces:[...faces.map(f=>({...f,depthShade:true})),...authorStage11Fractures(t,top)]});
 }
 // Roots continue from the actual wood endpoint across the adjoining stone.
 // The live rock clip constrains the small contact fan entirely inside rock.
 const sockets=[['rv-west-shoulder',3200,6165,1],['rv-west-rock-crown',4550,4800,1],['rv-west-rock-crown',6500,4900,-1],['rv-ritual-buttress',5400,7080,1],['rv-ritual-buttress',8100,6789,-1],['rv-ritual-buttress',9500,7600,-1],['rv-east-tower',9500,5314,1],['rv-east-tower',10500,4830,1],['rv-east-tower',12200,5670,-1],['rv-lower-refuge-rock',11000,8630,-1]];
 for(const[id,x,y,dir]of sockets){const m=materials.find(m=>m.terrainId===id),p=(dx,dy)=>[round(x+dx*dir),round(y+dy)];
  const pt=(dx,dy)=>p(dx,dy).join(' '),curve=(d,fill)=>m.faces.push({d,fill});
  curve(`M${pt(-77,8)}L${pt(6,-17)} ${pt(101,31)} ${pt(87,105)} ${pt(148,181)} ${pt(92,224)} ${pt(34,177)} ${pt(-5,103)} ${pt(-61,71)}Z`,'#162e39');
  curve(`M${pt(-77,8)}L${pt(-61,71)} ${pt(-5,103)} ${pt(34,177)} ${pt(9,166)} ${pt(-23,113)} ${pt(-82,91)} ${pt(-107,37)}Z`,'#536f70');
  curve(`M${pt(101,31)}L${pt(87,105)} ${pt(148,181)} ${pt(121,188)} ${pt(64,113)} ${pt(72,46)}Z`,'#3b5861');
  curve(`M${pt(-35,17)}Q${pt(-10,72)} ${pt(25,144)}L${pt(42,218)}Q${pt(75,265)} ${pt(125,279)}L${pt(83,231)} ${pt(67,176)}Q${pt(122,203)} ${pt(204,198)}Q${pt(132,183)} ${pt(88,134)}L${pt(48,78)} ${pt(8,-2)}Z`,'#213b3f');
  curve(`M${pt(-26,6)}Q${pt(-4,61)} ${pt(31,132)}L${pt(51,209)}Q${pt(82,254)} ${pt(112,264)}L${pt(75,215)} ${pt(61,156)}Q${pt(117,189)} ${pt(194,187)}Q${pt(128,175)} ${pt(84,124)}L${pt(41,66)} ${pt(8,-8)}Z`,'#68553c');
  curve(`M${pt(-8,9)}Q${pt(5,63)} ${pt(41,130)}L${pt(65,205)} ${pt(89,235)}Q${pt(65,211)} ${pt(57,177)}L${pt(33,126)}Q${pt(8,90)} ${pt(-16,35)}Z`,'#a08d61');
 }
 for(const[id,x,y,dir]of sockets){const m=materials.find(m=>m.terrainId===id),p=(xx,yy)=>[round(x+xx*dir),round(y+yy)];m.faces.push({points:[[-63,6],[-31,19],[-13,65],[-31,78],[-56,54],[-80,31]].map(q=>p(...q)),fill:'#8d9b89'});}
 const rear=project.library.find(a=>a.id==='stage11:ravine-rear-cliff-contact');
 // Extend the existing large shadow planes with three receding bed systems.
 // Everything stays inside its old silhouette and behind foreground solids.
 if(rear&&!rear.params.vectorFinishRevision){
  const extra=path('M4470 8120L5050 7750 5550 7850 5960 7530 6430 7660 6860 7380 7240 7530 7730 7360 8090 7820 8520 7780 9000 8190 9360 8030 9840 8440 10340 8190 10910 8580 11450 8390 12050 9030 12140 9400 11580 8890 10980 9130 10310 8730 9810 8970 9300 8540 8870 8730 8370 8280 7840 8390 7390 7940 6890 8140 6420 7950 6000 8240 5550 8180 5010 8510 4350 8740Z','#354b4b');
  const shadow=path('M4820 8720L5430 8500 5820 8710 6230 8430 6580 8540 6940 8350 7330 8700 7770 8530 8120 8920 8520 8690 8960 9080 9390 8920 9780 9320 10280 9060 10710 9400 11280 9220 11900 9700 12200 10050 11540 9670 11020 9950 10340 9520 9760 9830 9320 9510 8840 9730 8340 9280 7900 9470 7310 9030 6830 9210 6240 8850 5770 9220 5200 9010 4560 9460Z','#294345');
  const source=rear.vector.source.replace('</svg>',extra+shadow+'</svg>');rear.vector=compileSVG(source);rear.params.vectorFinishRevision=2;rear.params.nodeCount=nodeCount(rear.vector.root);
 }
 if(rear.params.vectorFinishRevision<3){
  const planes=path('M4800 6500L5050 6110 5370 6080 5680 6420 5520 7000 5110 7380 4800 7240Z M9830 6230L10220 5870 10560 6030 10830 6510 10520 6940 10110 6840Z M11130 7480L11490 7020 11820 7530 11940 8300 11540 8680 11270 8410Z','#3a5050')+path('M5110 7380L5520 7000 5630 7320 5490 7900 5130 8230 4930 7940Z M10110 6840L10520 6940 10780 7380 10630 7850 10240 7540 10000 7210Z M11540 8680L11940 8300 12100 9040 11790 9400 11390 9130Z','#1b343c')+path('M5050 6110L5370 6080 5480 6240 5220 6260 4950 6550Z M10220 5870L10560 6030 10630 6220 10360 6130 10010 6410Z','#52635b');
  rear.vector=compileSVG(rear.vector.source.replace('</svg>',planes+'</svg>'));rear.params.vectorFinishRevision=3;
 }
 rear.params.nodeCount=nodeCount(rear.vector.root);
 st.design.ravineArt={...st.design.ravineArt,materialRevision:3,materials};
 const idx=project.library.findIndex(a=>a.id==='stage11:ravine-refuge-bundle');project.library[idx]=shelterAsset(project.library[idx]);
 const e=st.elements.find(e=>e.id==='s11-art-refuge-bundle');e.scale=1;e.layer='back';
 return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file='shared/data/campaign.json',p=JSON.parse(readFileSync(file,'utf8'));applyStage11VectorFinish(p);writeFileSync(file,JSON.stringify(p)+'\n');console.log('Stage11 authored finish only; no map regeneration.');}
