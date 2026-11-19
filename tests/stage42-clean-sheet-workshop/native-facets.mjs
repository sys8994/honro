// Generic secondary native material faces. No contact/collision semantics,
// no old asset or raster coordinates; visually distinct from traversable bands.
const area=p=>p.reduce((t,a,i)=>{const b=p[(i+1)%p.length];return t+a[0]*b[1]-a[1]*b[0]},0);
const edges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
const cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const on=(a,b,p)=>cross(a,b,p)===0&&p.every((x,i)=>x>=Math.min(a[i],b[i])&&x<=Math.max(a[i],b[i]));
const hit=(a,b,c,d)=>on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b)||cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
const contains=(ring,p)=>!edges(ring).some(([a,b])=>on(a,b,p))&&edges(ring).filter(([a,b])=>(a[1]>p[1])!==(b[1]>p[1])&&p[0]<a[0]+(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])).length%2===1;
const colors=Object.freeze({'cool-relief':'#4d565d','cold-shadow':'#333e48','deep-fracture':'#252f37'});
const need=(v,msg)=>{if(!v)throw Error(msg)};
const key=/^[a-z][a-z0-9-]{0,32}$/;
export function compileNativeFacets(masses,faces){
 need(Array.isArray(masses)&&Array.isArray(faces)&&faces.length<=12,'Invalid grouped facet data');
 const known=new Map(masses.map(m=>[m.owner,m.polygon]));
 const owned=new Map(),ids=new Set(),out=[];
 for(const f of faces){
  need(Object.keys(f).sort().join(',')==='id,material,owner,points'&&key.test(f.id)&&!ids.has(f.id)&&known.has(f.owner)&&Object.hasOwn(colors,f.material),'Wrong facet identity or material');
  ids.add(f.id);
  const p=f.points,parent=known.get(f.owner);
  need(Array.isArray(p)&&p.length>=3&&p.length<=18&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isSafeInteger))&&new Set(p.map(q=>q.join(','))).size===p.length&&Math.abs(area(p))>1,'Invalid facet polygon');
  const ep=edges(p),eb=edges(parent);
  need(ep.every(([a,b],i)=>ep.every(([c,d],j)=>i===j||i===(j+1)%ep.length||j===(i+1)%ep.length||!hit(a,b,c,d))),'Facet self intersection');
  need(p.every(q=>contains(parent,q))&&ep.every(([a,b])=>eb.every(([c,d])=>!hit(a,b,c,d))),'Facet crosses shared seam/body boundary');
  // Faces of the same owner never stack opaque fills or overlap. Stage artists
  // can later request a deliberate shared edge feature, not automatic overdraw.
  const prev=owned.get(f.owner)??[];
  need(prev.every(q=>!contains(q,p[0])&&!contains(p,q[0])&&ep.every(([a,b])=>edges(q).every(([c,d])=>!hit(a,b,c,d)))),'Stacked/overlapping facet');
  prev.push(p);owned.set(f.owner,prev);
  out.push({tag:'path',id:'facet-'+f.id,d:'M'+p[0].join(',')+'L'+p.slice(1).map(q=>q.join(',')).join(' ')+'Z',fill:colors[f.material]});
 }
 return out;
}
