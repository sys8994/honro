import {rail} from './locked-envelope.mjs';
export const westRoles = [
 ['west-mica-cut-gentle-descent','upper-route','#46535a'],
 ['slate-west-short-falling-ledge','upper-route','#35434e'],
 ['thin-quiet-pinch-stone-tread','upper-route','#4b565a'],
 ['slate-east-rising-structural-slab','upper-route','#3c4953'],
 ['upper-flat-main-worn-timber','upper-route','#4a4036'],
 ['wood-dock-same-material-return','upper-route','#49433d'],
 ['west-backed-fold','back-0','#37454d'],
 ['mid-timber-north-post','upper-west-post-2450','#403c39'],
 ['mid-timber-stone-shoe','upper-west-post-2450','#50575a'],
 ['dock-timber-south-post','upper-west-post-3260','#443d36'],
 ['dock-timber-stone-shoe','upper-west-post-3260','#515b62']
];
const cuts=[0,984,1358,1568,2215,3548,4030];
const same=(a,b)=>a?.[0]===b?.[0]&&a?.[1]===b?.[1];
const need=(ok,msg)=>{if(!ok)throw Error(msg);};
const ring=p=>p.map((q,i)=>[q,p[(i+1)%p.length]]);
const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const sample=(a,b,f)=>[a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f];
const on=(a,b,p)=>Math.abs(cross(a,b,p))<1e-6&&p.every((v,i)=>v>=Math.min(a[i],b[i])-1e-8&&v<=Math.max(a[i],b[i])+1e-8);
const intersects=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
const touches=(a,b,c,d)=>intersects(a,b,c,d)||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b);
const area=p=>Math.abs(ring(p).reduce((z,[a,b])=>z+a[0]*b[1]-b[0]*a[1],0))/2;
const inside=(p,q)=>ring(p).some(([a,b])=>on(a,b,q))||ring(p).filter(([a,b])=>(a[1]>q[1])!==(b[1]>q[1])&&q[0]<a[0]+(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])).length%2===1;
const covers=(p,q)=>ring(q).every(([a,b])=>[0,.25,.5,.75,1].every(f=>inside(p,sample(a,b,f)))&&ring(p).every(([c,d])=>!intersects(a,b,c,d)));
const onContour=(boundary,pts)=>pts.every(p=>ring(boundary).some(([a,b])=>on(a,b,p)));
const clip=(x1,x2)=>rail[0].filter(([x])=>x>=x1&&x<=x2).concat(rail[1].filter(([x])=>x>=x1&&x<=x2).reverse());
const yAt=(p,x)=>{for(let i=1;i<p.length;i++)if(x>=p[i-1][0]&&x<=p[i][0])return sample(p[i-1],p[i],(x-p[i-1][0])/(p[i][0]-p[i-1][0]))[1];return NaN;};
export function verifyWestFaces(base,records,{complete=true}={}){
 need(Array.isArray(records)&&records.length<=westRoles.length&&(!complete||records.length===westRoles.length),'Require every scoped west material and support record');
 need(same(base?.upper?.top?.[0],[4030,1339])&&same(base?.upper?.bottom?.[0],[4030,1416]),'Existing exact eastern deck dock moved');
 const pByRole=new Map();let under=0;const faces=[];
 for(const r of records){
  need(r&&Object.keys(r).sort().join()==='id,owner,points,role','Noncanonical native editable west face');
  const i=westRoles.findIndex(q=>q[0]===r.role),cfg=westRoles[i],p=r.points;
  need(cfg&&r.owner===cfg[1]&&!pByRole.has(r.role)&&r.id==='f-'+(i+1),'One stable native record per role and owner, in defined sequence');
  need(records[i]===r,'Complete prior seam or structural parent first');
  need(Array.isArray(p)&&p.length>=3&&p.length<=20&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isSafeInteger)&&q[0]>=0&&q[0]<=4030&&q[1]>=1300&&q[1]<=2120),'Point outside west viewport guard');
  const e=ring(p);
  need(new Set(p.map(String)).size===p.length&&area(p)>0&&e.every(([a,b],j)=>e.every(([c,d],k)=>j===k||Math.abs(j-k)===1||Math.abs(j-k)===e.length-1||!touches(a,b,c,d))),'Self-touching or empty west face');
  if(i<6){
   const canonical=clip(cuts[i],cuts[i+1]);
   need(canonical.length>=4&&p.length===canonical.length&&p.every((q,n)=>same(q,canonical[n])),'Exact stock rail / underside and shared material seam locked');
  }else if(i===6){
   need(Array.isArray(base.back?.[0])&&covers(base.back[0],p)&&same(p[0],[834,1667])&&same(p[1],[984,1714])&&p.every(([x,y])=>x>=770&&x<=984&&y>=1667&&y<=1950),'Backing face must stay in its original rock, below the existing shared edge');
   need(p.every(([x,y])=>y>=yAt(rail[1],x)-1e-8),'Backing cannot paint across fascia');
  }else if(i===7||i===9){
   const [a,b,lo,hi]=i===7?[2427,2477,2390,2510]:[3240,3288,3210,3325];
   const sy=i===7?1491:1502;
   need(same(p[0],[a,sy])&&same(p[1],[b,sy])&&[a,b].every(x=>yAt(rail[1],x)>=sy&&yAt(rail[1],x)-sy<3),'Timber must seat against the exact occupied underside');
   need(p.every(([x,y])=>x>=lo&&x<=hi&&y>=sy)&&p.filter(([,y])=>y>2075.68).length===2,'Support may only descend within its narrow owner and bounded lower-rock seating range');
   need(p.filter(([x,y])=>y>2075.68).every(v=>{const s=base.sections.find(q=>q.top[0][0]<=v[0]&&q.top.at(-1)[0]>=v[0]);return s&&covers(s.top.concat(s.bottom.toReversed()),[v,[v[0]+.01,v[1]],[v[0],v[1]+.01]]); }),'Post toes must sit inside already occupied lower rock');
   under+=area(p);
  }else{
   const parent=pByRole.get(westRoles[i-1][0]);const [l,r]=i===8?[1980,2050]:[1975,2050];
   need(parent&&covers(parent,p)&&p.every(([,y])=>y>=l)&&area(p)<=area(parent)*.26&&p.filter(([,y])=>y>2075.68).length===2&&onContour(parent,p.filter(([,y])=>y>=r)),'Stone shoes must stay contained, seated on exact pier edges, not new silhouettes');
  }
  pByRole.set(r.role,p); faces.push({tag:'path',id:'upper-'+r.id,d:'M'+p.map(String).join('L')+'Z',fill:cfg[2]});
 }
 const deck=[...rail[0],...rail[1].toReversed()]; const airArea=area([[0,2075.68],[4030,2075.68],...rail[1].toReversed()]);
 const minAir=2075.68-Math.max(...rail[1].map(q=>q[1]));
 const all=faces.length===westRoles.length;
 need(minAir>=96&&under/airArea<.038,'Preserve canonical pinch clearance and strict occupied air budget');
 if(all)need(records.slice(0,6).reduce((z,q)=>z+area(q.points),0)===area(deck),'Material partition has void or overlap');
 const paintOrder=[6,7,8,9,10,0,1,2,3,4,5]; // Seats are visible inside their own pier, continuous occupied rim over piers.
 return {paths:paintOrder.filter(i=>faces[i]).map(i=>faces[i]),metrics:{minAir,airArea,postUnderAirFractionUpperBound:under/airArea,exactPartitionArea:area(deck),records:records.length,eastJoin:[rail[0].at(-1),rail[1].at(-1)],actorVisibility:'not proven by geometry'}};
}
