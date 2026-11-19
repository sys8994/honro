import {compileFullShape} from './model.mjs';
const roles=Object.freeze({
 'exposed-slate-flank':{family:'sample',fill:'#546269',ratio:.50,min:80},
 'return-stained-slab':{family:'sample',fill:'#3a4851',ratio:.45,min:75},
 'compressed-shale-web':{family:'sample',fill:'#303b45',ratio:.38,min:67},
 'toe-core-plane':{family:'sample',fill:'#303b43',ratio:.40,min:75},
 'toe-side-shear':{family:'sample',fill:'#46525a',ratio:.37,min:75},
 'toe-core-worked-rim':{family:'grain',fill:'#59636a',grainParent:'toe-core-plane'},
 'toe-shear-shadow-chip':{family:'grain',fill:'#34424b',grainParent:'toe-side-shear'},
 'ladder-approach-broken-lip':{family:'grain',fill:'#525c62',grainParent:'bed-cleaved'},
 'bed-cleaved':{family:'sample',fill:'#657179',ratio:.50,min:75},
 'bed-settled':{family:'sample',fill:'#4b5860',ratio:.53,min:75},
 'bed-scoured':{family:'sample',fill:'#788080',ratio:.14,min:38},
 'bed-recess':{family:'sample',fill:'#28343d',ratio:.56,min:75},
 'bed-foot':{family:'sample',fill:'#3a464e',ratio:.42,min:65},
 'rock-light':{family:'rock',fill:'#505a60',ratio:.35,min:85},
 'rock-middle':{family:'rock',fill:'#3c4850',ratio:.48,min:95},
 'rock-shadow':{family:'rock',fill:'#303940',ratio:.47,min:95},
 'rock-cut':{family:'rock',fill:'#353e46',ratio:.30,min:90},
 'rock-low-bearing':{family:'rock',fill:'#41494e',ratio:.35,min:75},
 'deck-fascia':{family:'upper',fill:'#3c3833',ratio:.60,min:140},
 'deck-joint':{family:'upper',fill:'#65584a',ratio:.32,min:80},
 'pier-shadow':{family:'bearing',fill:'#303634',ratio:.5,min:55},
 'pier-face':{family:'bearing',fill:'#4c4d45',ratio:.5,min:55},
 'pier-deck-brace-0':{family:'brace',bearing:'bearing-0',fill:'#4f4940'},
 'pier-deck-brace-1':{family:'brace',bearing:'bearing-1',fill:'#47443b'},
 'pier-deck-brace-2':{family:'brace',bearing:'bearing-2',fill:'#514b40'},
 'buttress-face':{family:'buttress',fill:'#28343d',ratio:.82,min:650},
 'gate-seat':{family:'seat',fill:'#535952',ratio:.18,min:140}
});
const keys=(x,ks)=>x&&Object.keys(x).sort().join()===ks.slice().sort().join();
const need=(v,e)=>{if(!v)throw Error(e)};
const at=(a,b)=>a[0]===b[0]&&a[1]===b[1],cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const on=(a,b,p)=>cross(a,b,p)===0&&p.every((x,i)=>x>=Math.min(a[i],b[i])&&x<=Math.max(a[i],b[i]));
const hit=(a,b,c,d)=>on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
const edges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
const area=p=>Math.abs(edges(p).reduce((v,[a,b])=>v+a[0]*b[1]-a[1]*b[0],0))/2;
const sample=(a,b,f)=>a.map((x,i)=>x+(b[i]-x)*f);
const point=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isSafeInteger)&&p[0]>=-2200&&p[0]<=8700&&p[1]>=-2300&&p[1]<=5200;
const boundary=(p,q)=>edges(p).some(([a,b])=>Math.abs(cross(a,b,q))<1e-6&&q.every((x,i)=>x>=Math.min(a[i],b[i])-1e-6&&x<=Math.max(a[i],b[i])+1e-6));
const inside=(p,q)=>boundary(p,q)||edges(p).filter(([a,b])=>(a[1]>q[1])!==(b[1]>q[1])&&q[0]<a[0]+(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])).length%2===1;
const reach=([a,b])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const nativePath=(p,id,fill)=>({tag:'path',id,d:'M'+p.map(q=>q.join(',')).join('L')+'Z',fill});
const subOwners=['west','center','east-rise','gate'];
const parentOf=base=>{
 const x=compileFullShape(base);
 return {...Object.fromEntries(x.sections.map(r=>['lower-'+r.zone,r.polygon])),
  ...Object.fromEntries(base.back.map((poly,i)=>['back-'+i,poly])),
  ...Object.fromEntries(base.bearings.map((r,i)=>['bearing-'+i,[...r.head,...r.sides[0],...r.toe.slice().reverse(),...r.sides[1]]])),
  'upper-route':x.upper.polygon,
  'margin-bottom':base.margins.find(m=>m.side==='bottom')?.points};
};
const overlap=(a,b)=>a.some(v=>inside(b,v)&&!boundary(b,v))||b.some(v=>inside(a,v)&&!boundary(a,v))||edges(a).some(([p,q])=>edges(b).some(([r,s])=>cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0));
export const detailRoles=Object.keys(roles);
export function fullDetailOwners(base){return [...Object.keys(parentOf(base)),'brace-corridor','gate-seat']}
export function compileDetailShapes(base,details,{complete=true}={}){
 const parents=parentOf(base),seen=new Set(),byOwner=new Map(),braces=new Set();
 need(Array.isArray(details)&&details.length<=96&&(!complete||details.length>=20),'Native preview resource guard exceeded or required structural evidence absent');
 const projected=details.map((d,n)=>{
  need(keys(d,['id','owner','role','points'])&&/^[a-z][a-z0-9-]{0,32}$/.test(d.id)&&!seen.has(d.id)&&Object.hasOwn(roles,d.role),'Wrong full detail ID/role');
  seen.add(d.id);
  const p=d.points,r=roles[d.role];
  need(Array.isArray(p)&&p.length>=3&&p.length<=18&&p.every(point)&&new Set(p.map(q=>q.join())).size===p.length&&area(p)>(r.family==='grain'?230:850),'Invalid or tiny detail contour');
  const ep=edges(p);
  need(ep.every(([a,b],i)=>ep.every(([c,z],j)=>i===j||i===(j+1)%ep.length||j===(i+1)%ep.length||!hit(a,b,c,z))),'Detail polygon crosses itself');
  if(r.family==='brace'){
   const a=parents[r.bearing],b=parents['upper-route'];
   need(d.owner==='brace-corridor'&&a&&!braces.has(r.bearing)&&p.length>=4&&p.filter(x=>inside(a,x)).length>=2&&p.filter(x=>inside(b,x)).length>=2,'A brace must intentionally enter both selected pier and deck; no floating trim');
   braces.add(r.bearing);
   const xMin=base.upper.top[0][0],xMax=base.upper.top.at(-1)[0];
   const functionY=(seq,x)=>{
    for(let i=1;i<seq.length;i++){const [a,b]=[seq[i-1],seq[i]];if(a[0]<=x&&x<=b[0])return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}
    return null;
   };
   const x=compileFullShape(base);
   const top=x.sections.flatMap((r,i)=>i?r.top.slice(1):r.top);
   need(ep.every(([a,b])=>[0,.25,.5,.75,1].every(f=>{const [xx,y]=sample(a,b,f),low=functionY(top,xx),high=functionY(base.upper.top,xx);
    return xx>=xMin&&xx<=xMax&&low!==null&&high!==null&&y<=low-112&&y>=high-18;
   })),'Brace occludes actor clearance or goes above upper deck');
   return {order:'before',owner:d.owner,role:d.role,path:nativePath(p,'detail-'+d.id,r.fill)};
  }
  if(r.family==='grain'){
   const cfg=d.role==='ladder-approach-broken-lip'?{owner:'lower-center',xmin:3390,xmax:3660,ymin:2116,ymax:2240}:{owner:'lower-east-rise',xmin:4190,xmax:4510,ymin:2120,ymax:2310};
   const d0=details.slice(0,n).filter(q=>q.owner===cfg.owner&&q.role===r.grainParent&&p.every(v=>inside(q.points,v)));
   need(d.owner===cfg.owner&&d0.length===1&&p.every(([x,y])=>x>=cfg.xmin&&x<=cfg.xmax&&y>=cfg.ymin&&y<=cfg.ymax),'Nested fracture outside exact face and safe below-lip envelope');
   const host=d0[0].points;
   need(ep.every(([a,b])=>[.25,.5,.75].every(f=>inside(host,sample(a,b,f)))&&edges(host).every(([c,z])=>!(cross(a,b,c)*cross(a,b,z)<0&&cross(c,z,a)*cross(c,z,b)<0))),'Nested fracture leaves existing midlayer');
   need(area(p)<area(host)*.085&&Math.max(...p.map(a=>a[0]))-Math.min(...p.map(a=>a[0]))<=128&&Math.max(...p.map(a=>a[1]))-Math.min(...p.map(a=>a[1]))<=94,'Accent is not small relative to the selected face');
   need(ep.some(([a,b])=>reach([a,b])>=25&&[0,.25,.5,.75,1].every(f=>boundary(host,sample(a,b,f)))),'Nested accent must return to a selected real crack edge');
   need(details.slice(0,n).every(t=>t===d0[0]||t.owner!==d.owner||!overlap(p,t.points)),'Accent competes with neighboring plane');
   return {order:'after',owner:d.owner,role:d.role,path:nativePath(p,'detail-'+d.id,r.fill)};
  }
  const semantic=d.owner==='gate-seat'?'lower-gate':d.owner,parent=parents[semantic];
  need(parent&&(r.family==='rock'?/^(lower-|back-)/.test(d.owner):r.family==='upper'?d.owner==='upper-route':r.family==='bearing'?/^bearing-/.test(d.owner):(r.family==='buttress'?d.owner==='margin-bottom':r.family==='sample'?['lower-center','lower-east-rise','margin-bottom'].includes(d.owner):d.owner==='gate-seat')),'Wrong role to actual native parent');
  need(p.every(q=>inside(parent,q))&&ep.every(([a,b])=>[.25,.5,.75].every(f=>inside(parent,sample(a,b,f))) &&
   edges(parent).every(([c,d])=>!(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0))),'Detail escapes owning face');
  const prev=byOwner.get(semantic)??[];
  const attached=[parent,...prev].reduce((total,q)=>total+ep.filter(([a,b])=>[0,.25,.5,.75,1].every(f=>boundary(q,sample(a,b,f)))).reduce((s,e)=>s+reach(e),0),0);
  need(attached>=r.min,'Floating plaque: measured ownership attachment insufficient');
  need(area(p)<=area(parent)*r.ratio,'Face replaces too much of parent area');
  if(r.family==='sample')need(p.every(([x,y])=>x>=2170&&x<=4532&&y>=1625),'Scene sample outside authored control');
  if(r.family==='buttress'){
   const margin=base.margins.find(m=>m.side==='bottom'),edge=margin.points.slice(0,2),
     upstream=details.find(v=>v.owner==='lower-center'&&['rock-shadow','bed-recess'].includes(v.role)&&edges(v.points).some(([a,b])=>at(a,edge[0])&&at(b,edge[1])));
   need(upstream&&edges(p).some(([a,b])=>at(a,edge[0])&&at(b,edge[1])),'Buttress plane must share the entire authored central rock seam');
  }
  if(r.family==='seat')need(p.every(([x])=>x>=5750&&x<=6880),'Gate-seat structural role outside actual gate scope');
  need(prev.every(q=>!overlap(p,q)),'Competing opaque detail overlaps');
  prev.push(p);byOwner.set(semantic,prev);
  return {order:'after',owner:d.owner,role:d.role,path:nativePath(p,'detail-'+d.id,r.fill)};
 });
 if(complete){
  need(subOwners.every(zone=>projected.filter(d=>d.owner==='lower-'+zone).length>=3),'All four lower regions need at least three purposeful authored faces');
  need(projected.filter(d=>d.owner==='upper-route').length>=2&&base.back.every((_,i)=>projected.some(d=>d.owner==='back-'+i)),'No complete deck/rock hierarchy');
  need(projected.filter(d=>d.order==='before').length>=1,'No verified anchored brace');
 }
 return projected;
}
function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
export function snapDetailPoint(base,owner,raw,worldRadius){
 const p=parentOf(base)[owner==='gate-seat'?'lower-gate':owner];if(!p||!Number.isFinite(worldRadius))return raw;
 let best=raw,near=worldRadius;
 for(const [a,b] of edges(p)){
  const dx=b[0]-a[0],dy=b[1]-a[1],count=gcd(dx,dy);
  if(!count)continue;
  const f=Math.max(0,Math.min(count,Math.round(((raw[0]-a[0])*dx+(raw[1]-a[1])*dy)*count/(dx*dx+dy*dy))));
  const q=[a[0]+f*(dx/count),a[1]+f*(dy/count)],dist=reach([q,raw]);
  if(dist<near){near=dist;best=q;}
 }
 return best;
}
