/** Rear structural planes and occupation-specific scenery. Walking edges stay unobscured. */
import {asset,put,P,R,line} from './act3-map-kit.mjs';
const at=(q,x)=>{for(let i=1;i<q.length;i++){const a=q[i-1],b=q[i];if(x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return q.at(-1)[1];};
function add(p,s,id,svg,bounds,material='stone'){const a=asset(`a3-location:${s.metadata.stageId}:${id}`,id,svg,[],bounds,material);a.params.rearOnly=true;put(p,s,a,id,0,0);s.elements.unshift(s.elements.pop());}
const arch=(x,y,w,h,c,inside)=>`<path fill="${c}" d="M${x-w/2} ${y}V${y-h*.60}Q${x-w/2} ${y-h} ${x} ${y-h}Q${x+w/2} ${y-h} ${x+w/2} ${y-h*.60}V${y}H${x+w/2-45}V${y-h*.58}Q${x+w/2-45} ${y-h+45} ${x} ${y-h+45}Q${x-w/2+45} ${y-h+45} ${x-w/2+45} ${y-h*.58}V${y}Z"/>`+(inside?`<path fill="${inside}" d="M${x-w/2+45} ${y}V${y-h*.58}Q${x-w/2+45} ${y-h+45} ${x} ${y-h+45}Q${x+w/2-45} ${y-h+45} ${x+w/2-45} ${y-h*.58}V${y}Z"/>`:'');
const lamp=(x,y)=>R(x-11,y-30,22,70,'#766343')+R(x-22,y-42,44,10,'#b1a274')+`<path fill="#d4b76e" d="M${x-13} ${y-47}Q${x-16} ${y-64} ${x} ${y-92}Q${x+18} ${y-69} ${x+13} ${y-47}Z"/>`;
function underBridge(p,s,id,x1,x2,top,bottom){const mid=(x1+x2)/2,w=x2-x1;let svg=P([[x1,top],[x2,top],[x2,bottom],[x2-85,bottom],[x2-85,top+170],[mid+70,top+85],[mid-70,top+85],[x1+85,top+170],[x1+85,bottom],[x1,bottom]],'#718172')+line([[x1+91,bottom],[x1+91,top+176],[mid-69,top+91],[mid+69,top+91],[x2-91,top+176],[x2-91,bottom]],'#a3a88f',11);for(const x of [x1+15,x2-60])for(const y of [top+70,top+210,bottom-50])svg+=R(x,y,45,7,'#445f56');add(p,s,id,svg,[x1-3,top-3,w+6,bottom-top+8]);}
export function addLocationDetail(p,s){const q=s.design.act3.primaryContour,id=s.metadata.stageId;
 if(id===23){
  underBridge(p,s,'west-masonry-water-arch',2130,2900,2570,2990);underBridge(p,s,'east-masonry-water-arch',4480,5160,2570,3000);
  let svg='';for(const [x,y,w,h]of [[830,2660,370,375],[2810,2540,290,345],[3670,2660,300,495],[5980,2660,480,380],[7050,2660,310,350]]){svg+=arch(x,y,w,h,'#768675','#294943');for(const k of [-.22,0,.22])svg+=R(x+w*k-7,y-h*.65,14,h*.65,'#59634c');svg+=R(x-w*.36,y-18,w*.72,18,'#9a9f83');}
  svg+=P([[5540,2260],[5690,2260],[5690,2660],[5540,2660]],'#667e71')+R(5570,2300,85,267,'#344e45')+R(5582,2298,61,17,'#aca180')+line([[5594,2320],[5594,2550]],'#948669',7)+line([[5634,2320],[5634,2550]],'#948669',7);
  svg+=lamp(1350,2510)+lamp(3500,2470)+lamp(6630,2510);
  add(p,s,'sluice-arches-and-loading-ports',svg,[560,2070,6700,620]);
 }
 if(id===25){
  let svg=P([[700,2203],[845,2122],[1010,2070],[1220,2170],[1370,2390],[1530,2685],[1405,2640],[1190,2500],[890,2310]],'#657259')+P([[4390,2540],[4570,2280],[4790,2090],[4940,2150],[5160,2206],[4930,2340],[4680,2520]],'#607056');
  // The cave side walls follow the same descending and rising entrances. They
  // are the rear plane of the section, never a replacement for floor solids.
  for(const [x,y,w,h]of [[1090,2470,135,270],[4490,2550,145,285]]){svg+=P([[x,y],[x+w,y-35],[x+w-9,y-h],[x+22,y-h+26]],'#849078');for(const yy of [y-85,y-174])svg+=line([[x+15,yy],[x+w-9,yy-20]],'#a4a88b',5);}
  for(const x of [2260,3670]){svg+=R(x,2240,67,460,'#66745e')+P([[x,2240],[x+17,2240],[x+15,2700],[x,2700]],'#a3a487')+R(x-12,2230,92,32,'#88947a')+R(x-10,2670,88,30,'#91957a');for(const y of [2330,2460,2585])svg+=line([[x+5,y],[x+61,y+6]],'#384e40',5);}
  svg+=R(2350,2228,1280,30,'#766145')+R(2380,2258,1220,13,'#3f4d39')+R(2830,2564,240,120,'#806a43')+P([[2817,2564],[2860,2536],[3040,2536],[3083,2564]],'#b49d6b')+R(2933,2569,21,110,'#384b3a')+R(2916,2613,52,24,'#b3a178');
  svg+=lamp(2555,2505)+lamp(3490,2505);add(p,s,'record-chamber-retaining-masonry',svg,[670,2060,4530,660]);
 }
 if(id===26){
  let svg='';
  // A bell-casting furnace, cooling bed, metal stock, and river washing bench
  // read as four separate work zones. No repeated decorative wheels.
  svg+=P([[2380,2670],[2408,2390],[2500,2320],[2602,2380],[2650,2670]],'#7d6547')+P([[2394,2670],[2425,2410],[2486,2348],[2486,2670]],'#a18b5f')+P([[2460,2670],[2460,2530],[2486,2490],[2524,2510],[2540,2670]],'#293c34')+R(2476,2590,47,46,'#ac7943')+P([[2420,2392],[2497,2328],[2592,2386],[2584,2410],[2494,2350],[2420,2417]],'#b6a47b');
  svg+=P([[3450,2670],[3470,2588],[3670,2588],[3708,2670]],'#7a7154')+R(3464,2568,241,24,'#b4a071')+R(3480,2599,20,68,'#4c513b')+R(3653,2599,21,69,'#4c513b');
  svg+=P([[4530,2520],[4560,2480],[4610,2478],[4633,2424],[4705,2438],[4745,2490],[4790,2520]],'#738070')+P([[4545,2508],[4582,2489],[4624,2494],[4610,2508]],'#c0b487')+P([[4645,2454],[4696,2458],[4710,2477],[4641,2472]],'#b5a77d')+line([[4570,2476],[4700,2470]],'#414d3e',11);
  const y=at(q,5960);svg+=R(5880,y-100,320,21,'#a08a5e')+R(5902,y-80,22,78,'#5a5239')+R(6152,y-80,22,78,'#5a5239')+P([[5920,y-101],[5940,y-160],[6030,y-152],[6058,y-102]],'#6c795f')+line([[6070,y-103],[6133,y-227]],'#958661',12);
  for(const [x,y,w,h]of [[3200,2670,24,490],[3830,2650,31,430]])svg+=P([[x,y],[x-3,y-h],[x+11,y-h-18],[x+w,y-h+19],[x+w+6,y]],'#344137')+P([[x+3,y-8],[x+7,y-h+32],[x+13,y-h+19],[x+11,y-4]],'#7d7050');
  svg+=line([[3210,2210],[3790,2390]],'#574a35',25)+line([[3220,2216],[3760,2384]],'#967b50',5);
  add(p,s,'foundry-kiln-cooling-and-metal-zones',svg,[2340,2160,3900,570],'wood');
 }
 if(id===27){let svg='';for(const [x,y,sign]of [[1860,at(q,1860),1],[5370,at(q,5370),-1]]){svg+=R(x-150,y-305,24,305,'#4f4937')+R(x+128,y-305,24,305,'#4f4937')+P([[x-179,y-297],[x-140,y-331],[x+142,y-331],[x+178,y-297],[x+165,y-278],[x-163,y-278]],'#354942')+line([[x-158,y-303],[x+160,y-303]],'#78836a',8)+line([[x-150,y-22],[x-100,y-92]],'#8a7753',17)+line([[x+145,y-50],[x+73,y-135]],'#716145',22);}
  // Carbonized archive bays and broken beams flank the surviving petition bay.
  for(const [x,y]of [[3180,2800],[4460,2800]]){svg+=R(x-22,y-300,38,300,'#354338')+R(x-16,y-273,7,264,'#82714f')+line([[x-40,y-274],[x+160,y-210]],'#4f4934',27)+R(x+38,y-65,150,52,'#6e6041')+R(x+31,y-74,162,13,'#9b855e');}
  add(p,s,'charred-door-frames-and-archive-bays',svg,[1660,1960,3920,870],'wood');
 }
 return s;
}
