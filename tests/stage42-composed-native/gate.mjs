const PLAN=Object.freeze([
 ['stone-west-post-shoe','#454a4b'],['stone-east-post-shoe','#474b4a'],['timber-west-load-post','#55463e',0],['timber-east-load-post','#4b3d36',1],['timber-west-split-face','#675449',2],
 ['timber-lintel-load-beam','#493c35',2,3],['bearing-west-bracket','#5f5146',2,5],['bearing-east-bracket','#584c43',3,5],['roof-lifted-end-silhouette','#333b40',5],['roof-weather-slope','#465056',8],['roof-ridge-tip','#414a50',8]
]);
const must=(b,msg)=>{if(!b)throw Error(msg)};
const edges=p=>p.map((q,i)=>[q,p[(i+1)%p.length]]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const on=(p,q,r)=>cross(p,q,r)===0&&r.every((n,i)=>n>=Math.min(p[i],q[i])&&n<=Math.max(p[i],q[i]));
const hit=(p,q,r,s)=>on(p,q,r)||on(p,q,s)||on(r,s,p)||on(r,s,q)||cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0;
const inside=(p,r)=>edges(p).some(([a,b])=>on(a,b,r))||edges(p).filter(([a,b])=>(a[1]>r[1])!==(b[1]>r[1])&&r[0]<a[0]+(b[0]-a[0])*(r[1]-a[1])/(b[1]-a[1])).length%2===1;
const overlap=(p,q)=>p.some(r=>inside(q,r))||q.some(r=>inside(p,r))||edges(p).some(([a,b])=>edges(q).some(([c,d])=>hit(a,b,c,d)));
const portal=[[5996,770],[6128,770],[6128,945],[5996,945]];
export const gateRoles=PLAN.map(([x])=>x);
export function gateCompile(base,details,records,{complete=true}={}){
 must(base.sections[3].top.some(p=>p.join()==='5872,946')&&base.sections[3].top.some(p=>p.join()==='6230,946')&&
   details.some(v=>v.owner==='gate-seat'&&v.role==='gate-seat'&&v.points.some(p=>p.join()==='5872,946')&&v.points.some(p=>p.join()==='6230,946')),'Exact new native gate seat missing');
 must(Array.isArray(records)&&records.length<=11&&(!complete||records.length===11),'Gate requires an exact ordered set of 11 authored roles');
 return records.map((r,i)=>{
  const [name,fill,...parents]=PLAN[i];
  must(Object.keys(r).sort().join() === 'id,points,role'&&r.id==='f-'+(i+1)&&r.role===name,'Wrong native gate role/order');
  const p=r.points;
  must(Array.isArray(p)&&p.length>=4&&p.length<=24&&p.every(v=>Array.isArray(v)&&v.length===2&&v.every(Number.isSafeInteger)&&v[0]>=5860&&v[0]<=6250&&v[1]>=570&&v[1]<=946)&&new Set(p.map(String)).size===p.length,'Gate points outside bounded owner');
  const e=edges(p);
  must(Math.abs(e.reduce((s,[a,b])=>s+a[0]*b[1]-a[1]*b[0],0))>=100&&e.every(([a,b],j)=>e.every(([c,d],k)=>j===k||j===(k+1)%e.length||k===(j+1)%e.length||!hit(a,b,c,d))),'Gate must be a simple nonzero native polygon');
  must(!overlap(p,portal),'Gate polygon covers path of portal');
  must(i>1||p.filter(([x,y])=>y===946&&x>=5872&&x<=6230).length>=2,'Gate foot floats above the owned seat');
  must(parents.every(j=>overlap(p,records[j].points)),'Gate member does not connect to every required bearing owner');
  return {id:name,tag:'path',fill,d:'M'+p.map(String).join('L')+'Z'};
 });
}

const ladderNames=['west-rail','east-rail','north-hook','south-cross-shoe',...Array.from({length:11},(_,i)=>'rung-'+String(i+1).padStart(2,'0'))].map(v=>'ladder-'+v);
const transitionNames=['deck-taper',...ladderNames];
export const composedRoles=[...gateRoles,...transitionNames];
const fills=['#49433d','#5a4b3d','#544637','#626052','#534e44',...Array.from({length:11},(_,i)=>[2,6,10].includes(i)?'#574b3d':'#625342')];
const yAt=(q,x)=>{for(const [i,b] of q.entries()){const a=q[i-1];if(a&&a[0]<=x&&x<=b[0])return a[1]+(x-a[0])*(b[1]-a[1])/(b[0]-a[0]);}return NaN;};
export function composeRouteCompile(base,details,records,{complete=true}={}){
 must(records.length<=27&&(!complete||records.length===27),'Native Gate + deck transition + separate ladder require 27 closed pointer polygons');
 const original=gateCompile(base,details,records.slice(0,11),{complete:complete||records.length>11});
 const prev=[];
 for(const [i,r] of records.slice(11).entries()){
  const name=transitionNames[i],p=r.points,e=edges(p);
  must(Object.keys(r).sort().join()==='id,points,role'&&r.id==='f-'+(i+12)&&r.role===name,'Unexpected native route order');
  must(p.length>=4&&p.length<=18&&p.every(q=>q.length===2&&q.every(Number.isSafeInteger))&&new Set(p.map(String)).size===p.length&&
       Math.abs(e.reduce((s,[a,b])=>s+a[0]*b[1]-a[1]*b[0],0))>80&&
       e.every(([a,b],j)=>e.every(([c,d],k)=>j===k||j===(k+1)%e.length||k===(j+1)%e.length||!hit(a,b,c,d))),'Invalid native route contour');
  if(i===0){
   const a=base.upper.top.at(-1),b=base.upper.bottom.at(-1),k=p.findIndex(v=>v[0]===5858);
   must(on(a,b,p[0])&&p[0].join()===a.join()&&p.at(-1).join()===b.join()&&k>=4&&p[k].join()==='5858,963','Taper must continue exact deck side and meet the existing road');
   const top=p.slice(0,k+1),bottom=p.slice(k).reverse(),ground=[base.joins[2].top,...base.sections[3].top];
   must(top.every(([x,y],j)=>x>=5532&&x<=5858&&y>=960&&y<=982&&(!j||x>top[j-1][0]))&&bottom.every(([x,y],j)=>x>=5532&&x<=5858&&y>=963&&y<=1098&&(!j||x>bottom[j-1][0])),'Invalid independent taper envelope');
   for(let x=5542;x<=5858;x++){
    const hi=yAt(top,x),lo=yAt(bottom,x),rock=yAt(ground,x);
    must(lo>=hi&&lo-hi<=119&&((x>5750&&lo<=rock+.3)||rock-lo>=96),'Taper hangs into protected deck/road zone');
   }
  }else{
   must(p.every(([x,y])=>x>=3860&&x<=4080&&y>=1320&&y<=2086),'Ladder left its exact visual owner range');
   if(i===1||i===2)must(Math.min(...p.map(q=>q[1]))<=1350&&Math.max(...p.map(q=>q[1]))>=2076,'Rail needs both visual terminals');
   else must(overlap(p,prev[1])&&overlap(p,prev[2]),'Ladder bracket/rung must attach to both real rail polygons');
  }
  prev.push(p);
  original.push({id:name,tag:'path',fill:fills[i],d:'M'+p.map(String).join('L')+'Z'});
 }
 return original;
}
