// Conservative containment for the pinned absolute M/L/C/Z masks.  No sampling
// shortcut: any unresolved curve/edge proximity fails closed.
export function maskContainsStrict(mask, polygon, pointInMask) {
 const intersection=(a,b,c,d)=>{
  const eps=1e-7,cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
  if([0,1].some(i=>Math.max(a[i],b[i])+eps<Math.min(c[i],d[i])||Math.max(c[i],d[i])+eps<Math.min(a[i],b[i])))return false;
  return cross(a,b,c)*cross(a,b,d)<=eps && cross(c,d,a)*cross(c,d,b)<=eps;
 };
 const bdis=(a,b,p)=>[0,1].some(i=>Math.max(a[i],b[i])+1e-7<Math.min(...p.map(q=>q[i]))||Math.max(...p.map(q=>q[i]))+1e-7<Math.min(a[i],b[i]));
 const mid=(a,b)=>a.map((v,i)=>(v+b[i])/2);
 const curveTouches=(a,b,p,depth=0)=>{
  if(bdis(a,b,p))return false;
  const [x,y,z,w]=p, xy=mid(x,y),yz=mid(y,z),zw=mid(z,w), u=mid(xy,yz),v=mid(yz,zw),m=mid(u,v);
  if(depth===16)return true;
  return curveTouches(a,b,[x,xy,u,m],depth+1)||curveTouches(a,b,[m,v,zw,w],depth+1);
 };
 const inPoly=q=>{
  let inside=false;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
   const [ax,ay]=polygon[j],[bx,by]=polygon[i];
   if((ay>q[1])!==(by>q[1])&&q[0]<(bx-ax)*(q[1]-ay)/(by-ay)+ax)inside=!inside;
  }return inside;
 };
 if(!polygon.every(q=>pointInMask(...q)))return false;
 const clear=(p,curve)=>!polygon.some((a,i)=>{
  const b=polygon[(i+1)%polygon.length];
  return curve?curveTouches(a,b,p):intersection(a,b,p[0],p[1]);
 });
 const close=(p,q)=>!p||!q||p[0]===q[0]&&p[1]===q[1]||clear([p,q],false);
 for(const d of mask){
  const t=d.match(/[A-Za-z]|[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[-+]?\d+)?/gi)??[];
  let start=null,p=null,i=0,k=null;
  while(i<t.length){
   if(/^[A-Za-z]$/.test(t[i]))k=t[i++];
   if(k==='Z'){if(!close(p,start))return false;p=start=null;k=null;continue;}
   if(!['M','L','C'].includes(k))return false;
   const n=k==='C'?6:2,values=t.slice(i,i+n).map(Number);i+=n;
   if(values.length!==n||values.some(v=>!Number.isFinite(v)))return false;
   const q=values.slice(-2);
   if(k==='M'){if(!close(p,start)||inPoly(q))return false;start=p=q;k='L';continue;}
   if(!p||!clear(k==='C'?[p,values.slice(0,2),values.slice(2,4),q]:[p,q],k==='C'))return false;
   p=q;
  }
  if(!close(p,start))return false;
 }
 return true;
}
