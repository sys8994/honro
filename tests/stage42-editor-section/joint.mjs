// V1 is a controlled 2-panel split: top/bottom endpoints and outer ring never move.
export function compileJoint(joint,box,facePath){
 const [x,y,w,h]=box;
 const {rim,anchor}=joint;
 const bounded=q=>Array.isArray(q)&&q.length===2&&q.every(Number.isFinite)&&q[0]>=x&&q[0]<=x+w&&q[1]>=y&&q[1]<=y+h;
 if(!Array.isArray(rim)||rim.length!==4||![...rim,anchor].every(bounded))throw Error('authoring envelope outside stage');
 const [N,E,S,W]=rim;
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 if(rim.some((p,i)=>cross(p,rim[(i+1)%4],rim[(i+2)%4])<100))throw Error('외곽을 위·오른쪽·아래·왼쪽 순서로 찍으세요');
 if(rim.some((p,i)=>cross(p,rim[(i+1)%4],anchor)<40))throw Error('절리점은 잠긴 외곽 내부에서만 움직입니다');
 const d=p=>facePath(p.map(point=>({point})),box);
 return {left:d([N,anchor,S,W]),right:d([N,E,S,anchor]),anchor,ends:[N,S]};
}

export function compileWorkshopJoint(owner,edit,facePath,compileJoint,guard,expected,sourceKey){
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
  joint={version:1,rim:edit.rim,anchor:edit.anchor,material:edit.material};
 }else if(edit.op==='joint.move'){
  if(before?.version!==1||edit.anchorKey!=='rock-seam' || !['left','right'].includes(edit.selectedFrom))throw Error('shared lock not selectable');
  joint={version:1,rim:before.rim,anchor:edit.anchor,material:before.material};
 }else throw Error('unsupported joint move');
 const palettes={slate:['#34363a','#434344'],fracture:['#403b38','#494644'],root:['#303239','#413c38']};
 if(!Object.hasOwn(palettes,joint.material))throw Error('invalid material pair');
 const [left,right]=palettes[joint.material];
 const built=compileJoint(joint,v.viewBox,facePath);
 // This scoped interaction proof leaves original paint under the affected region
 // and does not replace the broader art. The acquired lock is read-only vector.
 v.clips[cl]=guard;
 v.root={tag:'g',children:[sourceRoot,{tag:'g',clipPath:cl,children:[
  {tag:'path',id:'editor-joint-left',fill:left,d:built.left},
  {tag:'path',id:'editor-joint-right',fill:right,d:built.right}
 ]}]};
 p[key]={...joint,originalRoot:sourceRoot};
 return {edgeWall};
}
