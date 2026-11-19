// Semantic line tools produce opaque visual strips only. Never collision.
const contactRoles=Object.freeze({
 'lower-road':{thickness:32,pitch:.62,min:90,color:'#737676'},
 'raised-deck':{thickness:26,pitch:.32,min:160,color:'#777971'},
 'gate-landing':{thickness:24,pitch:.13,min:65,color:'#777a79'},
 'bearer-shadow':{thickness:22,pitch:.9,min:42,color:'#30393e'},
});
const contactCross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
const contactOn=(a,b,p)=>contactCross(a,b,p)===0&&p.every((x,i)=>x>=Math.min(a[i],b[i])&&x<=Math.max(a[i],b[i]));
const contactEdges=p=>p.map((a,i)=>[a,p[(i+1)%p.length]]);
const contactInside=(p,q)=>!contactEdges(p).some(([a,b])=>contactOn(a,b,q))&&contactEdges(p).filter(([a,b])=>(a[1]>q[1])!==(b[1]>q[1])&&q[0]<a[0]+(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])).length%2===1;
const contactHit=(a,b,c,d)=>contactOn(a,b,c)||contactOn(a,b,d)||contactOn(c,d,a)||contactOn(c,d,b)||contactCross(a,b,c)*contactCross(a,b,d)<0&&contactCross(c,d,a)*contactCross(c,d,b)<0;
const contactNeed=(v,e)=>{if(!v)throw Error(e);};
const contactRing=(p,t)=>[...p,...p.slice().reverse().map(([x,y])=>[x,y+t])];
const contactOverlap=(a,b)=>contactEdges(a).some(([x,y])=>contactEdges(b).some(([u,v])=>contactHit(x,y,u,v)))||contactInside(a,b[0])||contactInside(b,a[0]);
// Read exact intervals between knot/boundary intersections (not sample guesses).
const contactRuns=(profile,body,offset)=>{
 const state=[];
 for(let i=1;i<profile.length;i++){
  const [x,y0]=profile[i-1],[x2,y2]=profile[i],y=y0+offset,dx=x2-x,dy=y2-y0;
  const T=[0,1];
  for(const [[a,b],[c,d]] of contactEdges(body)){
   const vx=c-a,vy=d-b,det=dx*vy-dy*vx;
   if(!det){
    if(contactCross([x,y],[x2,y2+offset],[a,b])===0&&contactHit([x,y],[x2,y2+offset],[a,b],[c,d]))
     throw Error('상부 다리가 암체 경계를 눌러 붙습니다');
    continue;
   }
   const t=((a-x)*vy-(b-y)*vx)/det,u=((a-x)*dy-(b-y)*dx)/det;
   if(t>0&&t<1&&u>=0&&u<=1)T.push(t);
  }
  T.sort((a,b)=>a-b);
  for(let j=1;j<T.length;j++)if(T[j]-T[j-1]>1e-8){
   const t=(T[j]+T[j-1])/2,ind=contactInside(body,[x+t*dx,y+t*dy]);
   if(state.at(-1)!==ind)state.push(ind);
  }
 }
 return state;
};
export function compileContactBands(outline,facets,contacts){
 contactNeed(Array.isArray(contacts)&&contacts.length<=5,'접촉 띠는 최대 5개입니다');
 const used=new Set(),seen=new Set(),polys=[];
 return contacts.map(c=>{
  contactNeed(c&&Object.keys(c).sort().join(',')==='id,points,role'&&Object.hasOwn(contactRoles,c.role)&&/^[a-z][a-z0-9-]{0,32}$/.test(c.id)&&!seen.has(c.id),'접촉 띠 ID, 역할 또는 자료 오류');
  contactNeed(c.role==='bearer-shadow'||!used.has(c.role),'각 이동로 표시 역할은 하나씩만 가능합니다');
  seen.add(c.id);used.add(c.role);
  const r=contactRoles[c.role],p=c.points;
  contactNeed(Array.isArray(p)&&p.length>=2&&p.length<=16&&p.every(q=>Array.isArray(q)&&q.length===2&&q.every(Number.isSafeInteger)&&q[0]>=-2200&&q[0]<=8700&&q[1]>=-2300&&q[1]+r.thickness<=5200),'접촉 띠 좌표 오류');
  contactNeed(p.at(-1)[0]-p[0][0]>=r.min&&p.every((q,i)=>!i||q[0]-p[i-1][0]>=24&&Math.abs(q[1]-p[i-1][1])<r.pitch*(q[0]-p[i-1][0])+1),'경로를 왼쪽에서 오른쪽으로, 허용 경사 안에서 그리세요');
  const b=contactRing(p,r.thickness),e=contactEdges(b), wall=contactEdges(outline);
  if(c.role==='raised-deck'){
   for(const [x,y] of [p[0],p.at(-1)])contactNeed(contactInside(outline,[x,y])&&contactInside(outline,[x,y+r.thickness]),'상부 다리는 양 끝에 실제 시각 지지가 필요합니다');
   contactNeed([0,r.thickness].every(d=>contactRuns(p,outline,d).join(',')==='true,false,true'),'상부 다리가 하나의 공극을 건너며 하단 암체와 분리되어야 합니다');
  }else{
   contactNeed(b.every(q=>contactInside(outline,q))&&e.every(([a,z])=>wall.every(([x,y])=>!contactHit(a,z,x,y))),'표현 띠가 원래 암체 밖/공극을 가로지릅니다');
  }
  contactNeed(polys.every(q=>!contactOverlap(q,b)), '접지 또는 비충돌 받침 띠가 서로 겹칩니다');
  contactNeed(facets.every(q=>!contactOverlap(q.points,b)), '접촉 띠를 미술 암면과 분리하세요');
  polys.push(b);
  return {tag:'path',id:'contact-'+c.role+'-'+c.id,d:'M'+b.map(q=>q.join(',')).join('L')+'Z',fill:r.color};
 });
}
