// The two protected endpoints are stable ordered indices (0,end); no insertion/deletion in V4.
export function compileJoint(joint,box,facePath){
 const [x,y,w,h]=box,{rim,end,chain}=joint;
 const bounded=q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite)&&q[0]>=x&&q[0]<=x+w&&q[1]>=y&&q[1]<=y+h;
 if(!Array.isArray(rim)||rim.length<3||rim.length>32||!rim.every(bounded)||!Number.isInteger(end)||end<1||end>=rim.length)throw Error('외곽과 절리 양끝을 지정하세요');
 const d=p=>facePath(p.map(point=>({point})),box);
 d(rim);
 const N=rim[0],S=rim[end],cross=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
 const area=ps=>ps.reduce((v,a,i)=>{const b=ps[(i+1)%ps.length];return v+a[0]*b[1]-a[1]*b[0];},0)/2;
 if(area(rim)<=0)throw Error('외곽은 시계 방향으로 그리세요');
 if(!Array.isArray(chain)||chain.length<1||chain.length>16||!chain.every(bounded))throw Error('절리점은 1~16개입니다');
 const inPoly=q=>{let inside=false;for(let i=0,j=rim.length-1;i<rim.length;j=i++){const a=rim[j],b=rim[i];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;};
 if(!chain.every(inPoly))throw Error('절리가 암반 외곽을 벗어납니다');
 const rings={left:[N,...chain,S,...rim.slice(end+1)],right:[...rim.slice(0,end+1),...[...chain].reverse()]};
 const left=d(rings.left),right=d(rings.right);
 // FacePath rejects all non-adjacent touches/intersections; positive faces and
 // exact normalized signed-area partition prevent a crease turned outside.
 if(area(rings.left)<=0||area(rings.right)<=0||Math.abs(area(rim)-area(rings.left)-area(rings.right))>1e-5)throw Error('절리가 외곽과 양쪽 암면을 분리하지 못합니다');
 return {left,right,rings,ends:[N,S]};
}

export function compileWorkshopJoint(owner,edit,facePath,compileJoint,guard,expected,sourceKey,visible){
 const edgeWall=structuredClone(owner.edgeWall),v=edgeWall?.vector,p=edgeWall?.params;
 const key='workshopVisibleJoint42',cl='editor-visible-support';
 const checksum=s=>{let h=2166136261;for(let i=0;i<s.length;i++)h=Math.imul(h^s.charCodeAt(i),16777619);return h>>>0;};
 const before=p?.[key];
 if(!v?.root||!p||p.editorBodyRegions42||!v.clips?.[sourceKey])throw Error('unknown stage/body source');
 const sourceRoot=before?.originalRoot??v.root;
 if(sourceRoot.clipPath!==sourceKey||checksum(JSON.stringify([sourceRoot,v.clips[sourceKey]]))!==expected)throw Error('원본 가시 경계가 변경되었습니다. 새 검수가 필요합니다.');
 if(before&&(v.root.children?.[1]?.clipPath!==cl||JSON.stringify(v.clips[cl])!==JSON.stringify(guard)))throw Error('가시 경계 잠금 무결성 오류');
 if(!before&&Object.hasOwn(v.clips,cl))throw Error('가시 경계 key collision');
 if(edit.op==='joint.reset'){
  if(!before)throw Error('reset requires existing joint');
  v.root=sourceRoot;delete v.clips[cl];delete p[key];return {edgeWall};
 }
 let joint;
 if(edit.op==='joint.create'){
  if(before)throw Error('기존 공유 절리를 먼저 복구하세요');
  joint={version:4,rim:edit.rim,end:edit.end,chain:edit.chain,materials:edit.materials,ledges:edit.ledges??[]};
 }else if(edit.op==='rim.move'||edit.op==='joint.move'||edit.op==='joint.material'||edit.op==='ledge.put'||edit.op==='ledge.delete'){
  if(before?.version!==4||!['left','right'].includes(edit.selectedFrom))throw Error('select one of the two owning faces');
  joint={version:4,rim:before.rim,end:before.end,chain:before.chain,materials:before.materials,ledges:before.ledges};
  if(edit.op==='rim.move'){
   const i=edit.rimIndex;
   if(!Number.isInteger(i)||i<1||i>=joint.rim.length||i===joint.end)throw Error('절리 양끝은 고정입니다');
   joint.rim[i]=edit.point;
  }else if(edit.op==='joint.move'){
   const i=edit.anchorIndex;
   if(!Number.isInteger(i)||i<0||i>=joint.chain.length)throw Error('only editable shared control points can move');
   joint.chain[i]=edit.point;
  }else if(edit.op==='joint.material')joint.materials[edit.selectedFrom]=edit.material;
  else{
   const i=joint.ledges.findIndex(l=>l.id===edit.id&&l.parent===edit.selectedFrom);
   if(edit.op==='ledge.delete'){if(i<0)throw Error('wrong ledge owner');joint.ledges.splice(i,1);}
   else{
    const f={id:edit.id,parent:edit.selectedFrom,points:edit.points,material:edit.material};
    if(i<0)joint.ledges.push(f);else joint.ledges[i]=f;
   }
  }
 }else throw Error('unsupported joint move');
 const palettes={slate:'#393538',ledge:'#443f41',fracture:'#403b38',root:'#413c38',westMid:'#36393e',westDeep:'#303136'};
 const m=joint.materials;
 if(!m||Object.keys(m).length!==2||!['left','right'].every(side=>Object.hasOwn(m,side)&&Object.hasOwn(palettes,m[side])))throw Error('invalid materials');
 const left=palettes[m.left],right=palettes[m.right];
 const built=compileJoint(joint,v.viewBox,facePath);
 if(typeof visible!=='function'||!visible(joint.rim))throw Error('외곽이 원본 암벽 또는 잠긴 가시 영역을 벗어납니다');
 const rgba={shelf:'#4d484a',cut:'#504947'};
 if(!Array.isArray(joint.ledges)||joint.ledges.length>12)throw Error('maximum of 12 independent ledges');
 const exact=(v,keys)=>!!v&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const inside=(p,ring)=>{
  let ix=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[j],b=ring[i];
   if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])ix=!ix;
  }return ix;
 };
 const touch=(a,b,c,d)=>{
  const tol=1e-8;
  if([0,1].some(i=>Math.max(a[i],b[i])+tol<Math.min(c[i],d[i])||Math.max(c[i],d[i])+tol<Math.min(a[i],b[i])))return false;
  return cross(a,b,c)*cross(a,b,d)<=tol&&cross(c,d,a)*cross(c,d,b)<=tol;
 };
 const edges=(a,b)=>a.some((x,i)=>b.some((y,j)=>touch(x,a[(i+1)%a.length],y,b[(j+1)%b.length])));
 const ids=new Set();
 const authored=joint.ledges.map((f,i)=>{
  if(!exact(f,['id','parent','points','material'])||typeof f.id!=='string'||!/^ledge_[a-z0-9_]+$/i.test(f.id)||ids.has(f.id)||!Object.hasOwn(built.rings,f.parent)||!Object.hasOwn(rgba,f.material)||!Array.isArray(f.points)||f.points.length<3||f.points.length>12)throw Error('invalid ledge draft');
  ids.add(f.id);
  const d=facePath(f.points.map(point=>({point})),v.viewBox);
  const diag=Math.hypot(...[0,1].map(k=>Math.max(...f.points.map(p=>p[k]))-Math.min(...f.points.map(p=>p[k]))));
  if(diag>90)throw Error('침식턱 한 개가 너무 큽니다');
  const ring=built.rings[f.parent];
  if(!inside(f.points[0],ring)||edges(f.points,ring))throw Error('침식턱이 부모 암면 밖 또는 경계에 닿습니다');
  if(typeof visible!=='function'||!visible(f.points))throw Error('침식턱이 기존 가시 영역 밖에 있습니다');
  for(const other of joint.ledges.slice(0,i).filter(l=>l.parent===f.parent)){
   if(edges(f.points,other.points)||inside(f.points[0],other.points)||inside(other.points[0],f.points))throw Error('침식턱끼리 접촉하거나 겹칩니다');
  }
  return {tag:'path',id:f.id,fill:rgba[f.material],d};
 });
 // This scoped interaction proof leaves original paint under the affected region
 // and does not replace the broader art. The acquired lock is read-only vector.
 v.clips[cl]=guard;
 v.root={tag:'g',children:[sourceRoot,{tag:'g',clipPath:cl,children:[
  {tag:'path',id:'editor-joint-left',fill:left,d:built.left},
  {tag:'path',id:'editor-joint-right',fill:right,d:built.right},...authored
 ]}]};
 p[key]={...joint,originalRoot:sourceRoot};
 return {edgeWall};
}
