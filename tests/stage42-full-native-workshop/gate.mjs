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
