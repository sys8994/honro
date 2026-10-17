import {authorPlaceEncounters} from './act3-place-encounters-20261017.mjs';
import {refineRoofAccess25} from './stage25-roof-access.mjs';
/** Stage 25 only. V3 crossings/field investigations stay in their original positions.
 * The shaft is a working sluice, not a second cargo hall. */
import {P,R,line,asset,put} from './act3-map-kit.mjs';
export function refineMaintenance25(p,s){
 if(s.metadata.stageId!==25)return;
 const prefix='a3-maintenance25:';
 const originalElements=s.elements.filter(e=>!e.assetId.startsWith(prefix)||e.id==='vertical-depot-shell'||/^gallery-\d+$/.test(e.id)).map(e=>e.id==='vertical-depot-shell'?{...e,assetId:'a3-waterworks-v3:25:vertical-depot-shell'}:/^gallery-\d+$/.test(e.id)?{...e,assetId:'a3-waterworks-v3:25:'+e.id}:e);s.elements=[...originalElements];
 // Replace this authored revision rather than accumulating duplicate assets.
 p.library=p.library.filter(a=>!a.id.startsWith(prefix));
 s.design.act3.optionalRoutes=s.design.act3.optionalRoutes.filter(r=>r.id!=='west-stoplog-crest');
 const add=(id,svg,bounds,solids=[])=>{const a=asset(prefix+id,id,svg,solids,bounds,'stone');a.params.rearOnly=!solids.length;put(p,s,a,id,0,0);};
 // Recessed wall has no outline: the playable sill remains in front of it.
 let wall='';
 // Irregular arch rings are broad bearing planes, not framed rectangles.
 // Each dark inner face falls back into the shaft behind the actual galleries.
 for(const [x,y,w,h,crown]of [[110,4080,1080,1660,245],[1940,4980,1800,1780,350],[3340,3630,1990,2370,420],[1290,3180,1950,1120,300]]){
  const l=x+150,r=x+w-170,b=y+h,top=y+100;
  wall+=`<path d="M${x-20} ${b}L${x} ${top+90}Q${x+w*.24} ${top-crown-95} ${x+w*.59} ${top-crown+30}Q${x+w*.88} ${top-crown+10} ${x+w+35} ${top+120}L${x+w+5} ${b}L${r} ${b}L${r} ${top+180}Q${x+w*.68} ${top-crown+155} ${x+w*.45} ${top-crown+160}Q${x+w*.26} ${top-crown+110} ${l} ${top+150}L${l+20} ${b}Z" fill="#2e4447"/>`;
  wall+=`<path d="M${x+22} ${b}L${x+33} ${top+112}Q${x+w*.25} ${top-crown-45} ${x+w*.59} ${top-crown+76}L${x+w*.57} ${top-crown+127}Q${x+w*.28} ${top-crown+28} ${l} ${top+159}L${l+20} ${b}Z" fill="#435650"/>`;
  wall+=`<path d="M${r} ${b}L${r} ${top+180}Q${x+w*.72} ${top-crown+169} ${x+w*.59} ${top-crown+160}L${x+w*.62} ${top-crown+100}Q${x+w*.89} ${top-crown+80} ${x+w-12} ${top+150}L${x+w+5} ${b}Z" fill="#172e35"/>`;
  // Just three crown blocks and a sunken vertical seam describe the load.
  for(const [f,dy]of [[.26,18],[.48,-20],[.70,28]]){const xx=x+w*f,yy=top-crown+dy;wall+=P([[xx-55,yy],[xx+89,yy+15],[xx+65,yy+100],[xx-61,yy+76]],'#3d514b');}
  wall+=P([[x+21,b-470],[l+10,b-410],[l+19,b-220],[x+14,b-252]],'#233f42')+P([[r+9,b-810],[x+w-8,b-760],[x+w-3,b-350],[r+7,b-365]],'#1a353c');
 }
 // Silt-darkened abutment toes and the old high-water level attach the whole
 // facility to one drowned shaft rather than leaving freestanding scaffold legs.
 wall+=P([[30,5510],[1420,5530],[1760,5485],[1760,5980],[0,5980]],'#233c40')
  +P([[3320,5500],[4180,5460],[5340,5505],[5340,5980],[3270,5980]],'#183339')
  +P([[0,5500],[1090,5520],[1090,5542],[0,5522]],'#51605a')
  +P([[3350,5494],[4140,5460],[5325,5500],[5325,5521],[4145,5482],[3350,5515]],'#40564f');
 add('shaft-bearing-masonry',wall,[0,2700,5380,3290]);
 // Closed vertical timber gate and iron runners are in the rear shaft.
 let gate=P([[2290,1530],[2500,1660],[2380,5980],[2110,5980]],'#253e43')
  +P([[2940,1650],[3200,1510],[3460,5980],[3070,5980]],'#132b33')
  +P([[2415,1660],[2960,1660],[3090,5980],[2270,5980]],'#081c24');
 for(let i=0;i<7;i++){const x=2500+i*58;gate+=R(x,1840,48,3780,i%3===0?'#4b4b3b':'#3b4136')+R(x+5,1850,5,3750,'#665f46');}
 for(const y of [2220,3010,3860,4640,5420])gate+=R(2490,y,430,48,'#242f30')+R(2500,y+4,410,7,'#697064');
 gate+=P([[2355,1680],[2420,1710],[2310,5800],[2230,5800]],'#41534f')
  +P([[2970,1690],[3010,1660],[3190,5800],[3080,5800]],'#2b4141')
  +R(2467,1740,24,4070,'#4c5d5b')+R(2910,1740,24,4070,'#263e44');
 // The black throat and mineral-soaked mouth are exposed below the leaf.
 gate+=P([[2400,5620],[3010,5620],[3070,5980],[2310,5980]],'#071b23')
  +P([[2410,5630],[2470,5630],[2410,5930],[2335,5980]],'#344d4c')
  +P([[2960,5630],[3000,5630],[3060,5980],[2985,5980]],'#1d3b41');
 add('sluice-leaf-and-guides',gate,[2110,1510,1350,4470]);
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
 let anomaly=`<path d="M680 4408C1090 4405 1310 4320 1570 4280C1800 4242 1950 4140 2160 4090L2192 4130C1985 4210 1830 4300 1590 4322C1310 4365 1110 4440 680 4445Z" fill="#334e51"/>`
  +`<path d="M700 4410C1100 4410 1320 4325 1570 4285C1805 4252 1960 4150 2157 4095L2167 4110C1975 4177 1810 4272 1580 4300C1320 4340 1100 4426 700 4425Z" fill="#63736d"/>`
  +P([[720,4470],[1260,4435],[1540,4370],[1570,4400],[1280,4475],[720,4500]],'#18343c');
 add('rising-rear-watercourse',anomaly,[680,4080,1520,430]);
 const source=p.library.find(a=>a.id==='a3-waterworks-v3:25:vertical-depot-shell');
 const dark=JSON.parse(JSON.stringify(source));dark.id=prefix+'dark-shell';
 // A fresh shell is authored once from the canonical footprint. Large ink
 // planes and two recesses replace the original evenly coursed rear pillars.
 dark.vector=asset(prefix+'shell-source','수문 뒤 깊은 수직 물길',
  R(-16000,-10000,37600,29800,'#081b23')
  +`<defs><linearGradient id="maintenance-depth" x1="0" y1="1500" x2="4600" y2="5980" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#162b31"/><stop offset=".55" stop-color="#1d353b"/><stop offset="1" stop-color="#0a2029"/></linearGradient></defs>`
  +P([[-300,1450],[2100,1300],[2280,5980],[-300,5980]],'url(#maintenance-depth)')
  +P([[3160,1400],[5900,1500],[5900,5980],[3250,5980]],'#132a31')
  +`<path d="M210 5480V3280Q240 2670 850 2620Q1390 2710 1410 3330V5480Z" fill="#0b2028"/><path d="M4090 5620V2460Q4520 1890 5130 2410L5260 5620Z" fill="#0a2028"/>`
  +P([[300,1870],[1490,1710],[1840,1725],[1570,2440],[400,2770]],'#1b3238')
  +R(-300,5980,6200,2800,'#0b2531')+line([[-300,5996],[5900,5996]],'#567a78',9),[],[-16000,-10000,37600,29800],'stone').vector;
 p.library.push(dark);
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
   face+=P([[l+24,y+66],[l+(r-l)*.38,y+80],[l+(r-l)*.31,y+d],[l+12,y+d]],'#4c5b51')+P([[l+(r-l)*.76,y+78],[r-15,y+65],[r-15,y+d],[l+(r-l)*.69,y+d]],'#263e3f');
   for(let row=0;row<Math.min(5,Math.floor(d/310));row++){
    const yy=y+38+row*310;let x=l+12;
    for(let j=0;x<r-30;j++){const w=Math.min([430,590,370,510][(j+row)%4],r-x-8);face+=P([[x,yy+8],[x+w-9,yy],[x+w-3,yy+251],[x+12,yy+268]],['#51605a','#46564f','#5d6557'][(j+row)%3])+line([[x+13,yy+16],[x+w-19,yy+9]],'#7b8070',5);x+=w;}
   }
  }
  const replacement=asset(prefix+e.id,'수문 정비 회랑의 맞춤보와 석재 디딤면',face,[],[src.bounds.x,src.bounds.y,src.bounds.w,src.bounds.h],'stone');
  replacement.collision=structuredClone(src.collision);replacement.oneWay=src.oneWay;
  p.library.push(replacement);e.assetId=replacement.id;
 }

 refineRoofAccess25(p,s);
 authorPlaceEncounters(p,s);
 s.design.act3.maintenanceRevision=4;
 s.design.act3.optionalRoutes.push({id:'west-stoplog-crest',description:'낮은 직사선을 끊는 정비 석대. 양쪽 경사로를 기본 보행으로 오르고 돌아올 수 있다.',points:[{x:670,y:4050},{x:790,y:3965},{x:900,y:4050}]});
}
