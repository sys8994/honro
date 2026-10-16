import {refineRoofAccess25} from './stage25-roof-access.mjs';
/** Stage 25 only. V3 crossings/field investigations stay in their original positions.
 * The shaft is a working sluice, not a second cargo hall. */
import {P,R,line,asset,put} from './act3-map-kit.mjs';
export function refineMaintenance25(p,s){
 if(s.metadata.stageId!==25)return;
 const prefix='a3-maintenance25:';
 const originalElements=s.elements.filter(e=>!e.assetId.startsWith(prefix)||e.id==='vertical-depot-shell'||/^gallery-\d+$/.test(e.id)).map(e=>e.id==='vertical-depot-shell'?{...e,assetId:'a3-waterworks-v3:25:vertical-depot-shell'}:/^gallery-\d+$/.test(e.id)?{...e,assetId:'a3-waterworks-v3:25:'+e.id}:e);s.elements=[...originalElements];
 s.design.act3.optionalRoutes=s.design.act3.optionalRoutes.filter(r=>r.id!=='west-stoplog-crest');
 const add=(id,svg,bounds,solids=[])=>{const a=asset(prefix+id,id,svg,solids,bounds,'stone');a.params.rearOnly=!solids.length;put(p,s,a,id,0,0);};
 // Recessed wall has no outline: the playable sill remains in front of it.
 let wall='';
 for(const [x,y,w,h] of [[100,4050,1080,650],[1950,4950,1800,420],[3350,3600,1980,650],[1300,3150,1940,500]]){
  wall+=R(x,y-h,w,h,'#263d42')+R(x+35,y-h+32,w-70,h-32,'#172c33');
  for(const [a,b]of [[x,x+70],[x+w-90,x+w]]) wall+=P([[a,y-h],[b,y-h],[b+12,y],[a-20,y]],'#3c5354')+R(a+8,y-h+24,14,h-32,'#566863');
  wall+=R(x+38,y-h+36,w-80,36,'#354b4b');
 }
 // Heavy abutments and recessed masonry arches explain the otherwise floating
 // galleries. They are rear-wall masonry, never a false foreground landing.
 for(const [x,y,w,h] of [[130,4150,1000,690],[1960,5050,1770,870],[3370,3700,1910,1600],[1310,3250,1900,310]]){
  const l=x+130,r=x+w-130,top=y+100,bottom=y+h;
  const inner=Array.from({length:13},(_,i)=>{const t=Math.PI*i/12;return[r-(r-l)*i/12,top+160-200*Math.sin(t)];});
  wall+=P([[x,y],[x+w,y],[x+w,bottom],[r,bottom],...inner,[l,bottom],[x,bottom]],'#344d51');
  wall+=line(inner,'#536663',32);
  // Broad dressed-stone courses at the loaded crown, recessed joints below.
  for(const [f,width]of [[.03,.22],[.27,.3],[.59,.19],[.8,.17]])wall+=P([[x+w*f,y+12],[x+w*(f+width),y+8],[x+w*(f+width)-7,y+64],[x+w*f+5,y+70]],'#425955');
  wall+=P([[r-5,top+164],[r+34,top+170],[r+34,bottom],[r-5,bottom]],'#233c43');
  wall+=P([[x,y+20],[x+36,y+20],[x+44,bottom],[x,bottom]],'#64736a');
 }
 add('shaft-bearing-masonry',wall,[80,2600,5300,3300]);
 // Closed vertical timber gate and iron runners are in the rear shaft.
 let gate=R(2480,1740,450,4080,'#10252d');
 for(let i=0;i<7;i++){const x=2500+i*58;gate+=R(x,1840,48,3780,i%3===0?'#4b4b3b':'#3b4136')+R(x+5,1850,5,3750,'#665f46');}
 for(const y of [2220,3010,3860,4640,5420])gate+=R(2490,y,430,48,'#242f30')+R(2500,y+4,410,7,'#697064');
 gate+=R(2467,1740,24,4070,'#4c5d5b')+R(2910,1740,24,4070,'#263e44');
 add('sluice-leaf-and-guides',gate,[2460,1730,490,4100]);
 // A grounded winding drum, bearings and paired hemp lines. No animated,
 // interactable control is invented: these explain the old maintenance use.
 let winding=R(1680,2855,400,32,'#67583e')+R(1710,2885,30,265,'#716044')+R(2010,2885,30,265,'#554b38');
 winding+=P([[1688,3120],[1758,3120],[1770,3150],[1676,3150]],'#849080')+P([[1990,3120],[2060,3120],[2072,3150],[1978,3150]],'#748172');
 winding+=R(1735,2948,280,86,'#8a7550')+R(1735,2995,280,39,'#514b39');
 for(const x of [1780,1798,1816,1834,1852,1870,1888,1906,1924,1942,1960])winding+=line([[x,2954],[x,3025]],'#b1a07a',5);
 winding+=line([[2018,2990],[2090,2940],[2130,2980]],'#8b7954',17)+line([[1880,2952],[1880,2770],[2680,2770],[2680,2990]],'#847c61',7)+line([[1894,2952],[1894,2786],[2694,2786],[2694,2990]],'#4d5145',6);
 add('maintenance-winding-drum',winding,[1650,2750,1080,420]);
 // Local raised working face interrupts direct low fire without changing a
 // required gate edge. Both slopes are reachable/returnable by basic walking.
 const crest=[[670,4050],[770,3965],[810,3965],[900,4050],[900,4080],[670,4080]];
 add('west-stoplog-workbench',P(crest,'#6c7160','#1c343b',3)+line(crest.slice(0,4),'#a5a48b',8)+P([[692,4050],[778,3988],[804,3988],[876,4050]],'#424f46'),[666,3960,240,130],[crest]);
 // Finite, rear stoplog racks sit at working height, not repeated palaces.
 let racks='';for(const [x,y,w]of [[2150,4950,380],[3820,3600,420]]){
  racks+=R(x,y-250,22,250,'#6b6045')+R(x+w,y-250,22,250,'#5d553e');
  for(const dy of [55,110,165,220])racks+=R(x-24,y-dy,w+66,27,'#7a6a4c')+R(x-18,y-dy+3,w+53,5,'#a18c61');
  racks+=line([[x,y-230],[x+w+20,y-20]],'#434b3b',15);
 }add('stoplog-storage',racks,[2110,3350,2180,1610]);
 // A restrained first inconsistency precedes the stronger depot encounter.
 // This is rear scenery only: no material pool, collider, gravity or gate edit.
 let anomaly=P([[690,4390],[990,4344],[1410,4308],[1830,4185],[2120,4160],[2120,4190],[1850,4218],[1430,4337],[1010,4372],[690,4420]],'#3c5559')
  +P([[700,4390],[1000,4344],[1420,4310],[1840,4187],[2110,4162],[2110,4170],[1840,4196],[1420,4320],[1000,4354],[700,4400]],'#60706d')
  +P([[720,4450],[1280,4430],[1550,4360],[1580,4395],[1290,4470],[720,4490]],'#21373e')
  +P([[1680,4330],[2110,4215],[2120,4250],[1690,4365]],'#233b42');
 add('rising-rear-watercourse',anomaly,[680,4150,1460,350]);
 const source=p.library.find(a=>a.id==='a3-waterworks-v3:25:vertical-depot-shell');
 const dark=JSON.parse(JSON.stringify(source));dark.id=prefix+'dark-shell';
 const shade=v=>{if(Array.isArray(v))return v.map(shade);if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,shade(x)]));if(typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v))return '#'+[1,3,5].map(i=>Math.round(parseInt(v.slice(i,i+2),16)*.64).toString(16).padStart(2,'0')).join('');return v;};
 dark.vector=shade(dark.vector);p.library.push(dark);
 const added=s.elements.filter(e=>e.assetId.startsWith(prefix));
 const old=originalElements.filter(e=>!e.assetId.startsWith(prefix));const split=old.findIndex(e=>e.id==='vertical-depot-shell')+1;
 s.elements=[...old.slice(0,split),...added.filter(e=>e.id!=='west-stoplog-workbench'),...old.slice(split),...added.filter(e=>e.id==='west-stoplog-workbench')];
 s.elements.find(e=>e.id==='vertical-depot-shell').assetId=dark.id;
 // Replace repetitive triangular corbels with dressed sill stones and recessed
 // mortised joists. Contact polygons/one-way flags are copied exactly.
 for(const e of s.elements.filter(e=>/^gallery-\d+$/.test(e.id))){
  const src=p.library.find(a=>a.id===e.assetId),poly=src.collision[0].map(q=>[q.x,q.y]);
  const xs=poly.map(q=>q[0]),ys=poly.map(q=>q[1]),l=Math.min(...xs),r=Math.max(...xs),y=Math.min(...ys),d=Math.max(...ys)-y;
  let face=P(poly,'#384b49')+P([[l,y],[r,y],[r-6,y+20],[l+5,y+22]],'#a9aa91');
  if(d<200){
   face+=R(l+8,y+25,r-l-16,28,'#72674e')+R(l+16,y+56,r-l-32,38,'#413d30');
   for(const f of [.12,.43,.79]){const x=l+(r-l)*f;face+=R(x,y+25,54,69,'#887451')+R(x+8,y+34,35,9,'#a18e66')+R(x+17,y+63,18,17,'#2d3029');}
   face+=line([[l+19,y+94],[r-24,y+94]],'#222f2c',9);
  }else{
   for(let row=0;row<Math.min(8,Math.floor(d/190));row++){
    const yy=y+38+row*190;let x=l+12;
    for(let j=0;x<r-30;j++){const w=Math.min([280,370,230,330][(j+row)%4],r-x-8);face+=P([[x,yy+8],[x+w-9,yy],[x+w-3,yy+150],[x+12,yy+168]],['#51605a','#46564f','#5d6557'][(j+row)%3])+line([[x+13,yy+16],[x+w-19,yy+9]],'#7b8070',5);x+=w;}
   }
  }
  const replacement=asset(prefix+e.id,'수문 정비 회랑의 맞춤보와 석재 디딤면',face,[],[src.bounds.x,src.bounds.y,src.bounds.w,src.bounds.h],'stone');
  replacement.collision=structuredClone(src.collision);replacement.oneWay=src.oneWay;
  p.library.push(replacement);e.assetId=replacement.id;
 }

 refineRoofAccess25(p,s);
 s.design.act3.maintenanceRevision=3;
 s.design.act3.optionalRoutes.push({id:'west-stoplog-crest',description:'낮은 직사선을 끊는 정비 석대. 양쪽 경사로를 기본 보행으로 오르고 돌아올 수 있다.',points:[{x:670,y:4050},{x:790,y:3965},{x:900,y:4050}]});
}
