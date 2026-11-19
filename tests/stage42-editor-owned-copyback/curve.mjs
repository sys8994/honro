// Handles are absolute editor-local coordinates. Null means corner/no handle.
export function facePath(nodes, box, tolerance=.25) {
 const [x,y,w,h]=box;
 if(![x,y,w,h,tolerance].every(Number.isFinite)||w<=0||h<=0||tolerance<=0||tolerance>1)throw Error('invalid bounds');
 const inside=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=x&&p[0]<=x+w&&p[1]>=y&&p[1]<=y+h;
 if(!Array.isArray(nodes)||nodes.length<3||nodes.length>128||nodes.some(n=>!inside(n?.point)||[n.in,n.out].some(p=>p!=null&&!inside(p))))throw Error('invalid node or outside bounds');
 const ps=nodes.map(n=>n.point);
 if(new Set(ps.map(p=>p.join(','))).size!==ps.length)throw Error('duplicate anchors');
 const avg=(a,b)=>a.map((v,i)=>(v+b[i])/2), dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]), sub=(a,b)=>a.map((v,i)=>v-b[i]);
 const fmt=p=>p.join(' ');
 const flat=[ps[0]];
 function flatten(a,b,c,d,k=0){
  // Difference from the straight chord's cubic controls bounds parametric positional error.
  if(Math.max(dist(b,a.map((v,i)=>(2*v+d[i])/3)),dist(c,a.map((v,i)=>(v+2*d[i])/3)))<=tolerance){flat.push(d);if(flat.length>4096)throw Error('too complex');return;}
  if(k===16)throw Error('curve too complex');
  const ab=avg(a,b),bc=avg(b,c),cd=avg(c,d),l=avg(ab,bc),r=avg(bc,cd),m=avg(l,r);
  flatten(a,ab,l,m,k+1);flatten(m,r,cd,d,k+1);
 }
 let path='M'+fmt(ps[0]);
 for(let i=0;i<nodes.length;i++){
  const a=nodes[i],b=nodes[(i+1)%nodes.length];
  if(a.out||b.in){const c=a.out??a.point.map((x,j)=>(2*x+b.point[j])/3),d=b.in??a.point.map((x,j)=>(x+2*b.point[j])/3);path+='C'+[c,d,b.point].map(fmt).join(' ');flatten(a.point,c,d,b.point);}
  else{path+='L'+fmt(b.point);flat.push(b.point);}
 }
 const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
 const o=(a,b,c)=>cross(sub(b,a),sub(c,a));
 const near=(p,a,b)=>{
  const d=sub(b,a),q=sub(p,a),t=Math.max(0,Math.min(1,(q[0]*d[0]+q[1]*d[1])/(d[0]**2+d[1]**2)));
  return dist(p,a.map((v,i)=>v+t*d[i]));
 };
 let area=0;const n=flat.length-1;
 for(let i=0;i<n;i++){
  let a=flat[i],b=flat[i+1];
  if(dist(a,b)<1e-8)throw Error('zero segment');
  area+=cross(sub(a,flat[0]),sub(b,flat[0]));
  for(let j=i+2;j<n;j++){
   if(!i&&j===n-1)continue;
   let c=flat[j],d=flat[j+1];
   if([0,1].every(k=>Math.min(a[k],b[k])<=Math.max(c[k],d[k])&&Math.min(c[k],d[k])<=Math.max(a[k],b[k]))&&o(a,b,c)*o(a,b,d)<=0&&o(c,d,a)*o(c,d,b)<=0)throw Error('self-intersection or touching');
   if(Math.min(near(a,c,d),near(b,c,d),near(c,a,b),near(d,a,b))<=2*tolerance)throw Error('unresolved near-contact');
  }
 }
 if(Math.abs(area)<2)throw Error('degenerate face');
 return path+'Z';
}
