import {compileStructure} from '../stage42-native-structure-local/structure.mjs';
const roles=Object.freeze({
  'road-stratum':{family:'road',fill:'#465057',min:90,ratio:.38},
  'road-break':{family:'road',fill:'#343E46',min:70,ratio:.34},
  'shoulder-face':{family:'back',fill:'#46535B',min:110,ratio:.44},
  'shoulder-fracture':{family:'back',fill:'#25333C',min:90,ratio:.38},
  'shoulder-mid':{family:'back',fill:'#39464E',min:100,ratio:.37},
  'deck-fascia':{family:'deck',fill:'#4A433A',min:180,ratio:.66},
  'deck-leading':{family:'deck',fill:'#61584B',min:140,ratio:.42},
  'pier-face':{family:'support',fill:'#3C3A35',min:62,ratio:.55},
  'footing-west':{family:'seat',bearing:'support-0',fill:'#505656',min:0,ratio:.17},
  'footing-east':{family:'seat',bearing:'support-1',fill:'#414A4D',min:0,ratio:.17},
  'cross-brace':{family:'brace',fill:'#414746',min:0,ratio:1},
  'pier-deck-brace':{family:'brace',bearing:'support-0',fill:'#4C463D',min:0,ratio:1},
  'east-counterbrace':{family:'brace',bearing:'support-1',fill:'#3C3A35',min:0,ratio:1}
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
const strip=x=>[...x.top,...x.underside.slice().reverse()];
const parentOf=b=>({'road-shelf':strip(b.road),'raised-deck':strip(b.deck),'back-rock':b.background,...Object.fromEntries(b.supports.map((s,i)=>['support-'+i,[...s.head,...s.sides[0],...s.toe.slice().reverse(),...s.sides[1]]]))});
const overlap=(a,b)=>a.some(v=>inside(b,v)&&!boundary(b,v))||b.some(v=>inside(a,v)&&!boundary(a,v))||edges(a).some(([p,q])=>edges(b).some(([r,s])=>cross(p,q,r)*cross(p,q,s)<0&&cross(r,s,p)*cross(r,s,q)<0));
export const detailRoles=Object.keys(roles);
export function compileDetailShapes(base,details,{complete=true}={}){
 compileStructure(base);need(Array.isArray(details)&&details.length<=12&&(!complete||details.length>=8),'A completed lighting pass needs 8–12 authored details');
 const parents=parentOf(base),seen=new Set(),byOwner=new Map(),bearingLinks=new Set();
 const projected=details.map(d=>{
  need(keys(d,['id','owner','role','points'])&&/^[a-z][a-z0-9-]{0,31}$/.test(d.id)&&!seen.has(d.id)&&Object.hasOwn(roles,d.role),'Invalid detail role/owner/ID');
  seen.add(d.id);
  const p=d.points,r=roles[d.role];
  need(Array.isArray(p)&&p.length>=3&&p.length<=16&&p.every(point)&&new Set(p.map(q=>q.join())).size===p.length&&area(p)>700,'Invalid editable detail geometry');
  const ep=edges(p);
  need(ep.every(([a,b],i)=>ep.every(([c,z],j)=>i===j||i===(j+1)%ep.length||j===(i+1)%ep.length||!hit(a,b,c,z))),'Detail polygon crosses itself');
  if(r.family==='brace'){
   const a=parents[r.bearing??'support-0'],b=parents[d.role==='cross-brace'?'support-1':'raised-deck'];
   need(!bearingLinks.has(r.bearing),'Duplicate brace attachment');bearingLinks.add(r.bearing);
   need(d.owner==='cross-structure'&&p.length>=4&&p.filter(x=>inside(a,x)).length>=2&&p.filter(x=>inside(b,x)).length>=2,'Brace must enter two distinct named bearing parents');
   const [manualLeft]=base.deck.top,[lX,rX]=[manualLeft[0],base.deck.top.at(-1)[0]];
   const minY=Math.min(...base.deck.underside.map(v=>v[1]))-22,maxY=Math.min(...base.road.top.map(v=>v[1]))-122;
   need(p.every(([x,y])=>x>=lX&&x<=rX&&y>=minY&&y<=maxY),'Cross brace obscures lower corridor or leaves deck envelope');
   return {owner:d.owner,role:d.role,layer:'structural-back',order:'before-parent',path:nativePath(p,'detail-'+d.id,r.fill)};
  }
  const parent=parents[d.owner];
  need(parent&&((r.family==='road'||r.family==='seat')?d.owner==='road-shelf':r.family==='deck'?d.owner==='raised-deck':r.family==='back'?d.owner==='back-rock':/^support-[01]$/.test(d.owner)),'Wrong structural parent for material role');
  need(p.every(q=>inside(parent,q))&&ep.every(([a,b])=>edges(parent).every(([c,d])=>!(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0))&&[.25,.5,.75].every(f=>inside(parent,sample(a,b,f)))),'Shape escapes owning face');
  const prev=byOwner.get(d.owner)??[];
  const attached=[parent,...prev].reduce((count,container)=>count+ep.filter(([a,b])=>boundary(container,a)&&boundary(container,b)&&[.25,.5,.75].every(f=>boundary(container,sample(a,b,f)))).reduce((n,e)=>n+reach(e),0),0);
  if(r.family==='seat')need(p.filter(q=>inside(parents[r.bearing],q)).length>=2,'Footing must embed in road and named bearing');
  else need(attached>=r.min,'Floating decorative patch: no measured shared parent or validated neighbor boundary');
  need(area(p)<=area(parent)*r.ratio,'Detail would repaint too much of parent face');
  need(prev.every(q=>!overlap(p,q)),'Competing native detail faces overlap');
  prev.push(p);byOwner.set(d.owner,prev);
  return {owner:d.owner,role:d.role,layer:d.owner==='back-rock'?'back':'structural-back',order:'inside-parent',path:nativePath(p,'detail-'+d.id,r.fill)};
 });
 if(complete)need(Object.keys(parents).filter(k=>!k.startsWith('support')).every(k=>projected.some(x=>x.owner===k))&&['support-0','support-1'].every((k,i)=>projected.some(x=>x.owner===k||x.role===(i===0?'footing-west':'footing-east')))&&projected.filter(x=>x.order==='before-parent').length<=2,'Coverage must include every structural parent, up to two separate braces');
 return projected;
}

function gcd(a,b){return b?gcd(b,a%b):Math.abs(a);}
export function snapDetailPoint(base,owner,raw,worldRadius){
 const p=parentOf(base)[owner];if(!p||!Number.isFinite(worldRadius))return raw;
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
