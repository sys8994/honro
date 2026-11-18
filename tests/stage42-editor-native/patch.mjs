export function installEditor(source){
const marker='window.HonroWorkshopAPI=';
if(source.split(marker).length!==2)throw Error('unexpected editor entry');
const originalToolbar='[["select","선택"],["terrain","지형"],["solid","Solid"],["material","재질"],["place","배치"],["scatter","Scatter"],["unit","유닛"],["event","이벤트"],["pan","Pan"]]';
const drawHook='if(tool==="terrain"){drawStroke=[w];return}';
const canvasRender='function renderStage(){';
const upHook='function stagePointerUp(e,p){';
const moveHook='if(tool==="terrain"&&drawStroke.length){';
const cancelHook='pointer=null});c.addEventListener("dblclick"';
const keyHook='if(e.key==="Enter"){';
for(const k of [originalToolbar,drawHook,canvasRender,keyHook,upHook,moveHook,cancelHook])if(!source.includes(k))throw Error('workshop UI seam missing: '+k);
source=source.replace(originalToolbar,originalToolbar+'.concat(project.activeStageId==="stage-42"?[["nativeBody","암반 작도"]]:[])').replace(drawHook, 'if(tool==="nativeBody"){bodyPointer(w,p);return}'+drawHook).replace(keyHook,keyHook+'if(tool==="nativeBody"){bodyPreview();return}').replace(moveHook,'if(tool==="nativeBody"){bodyDrag(w,p);return}'+moveHook)
.replace(upHook,upHook+'if(tool==="nativeBody"&&!p.pan){bodyUp(e,p);return}')
.replace(cancelHook,'pointer=null});c.addEventListener("pointercancel",()=>{if(kind==="stage"&&pointer?.nativeBodyVertex!=null){bodyDraft[pointer.nativeBodyVertex]=pointer.nativeBodyBefore;bodyMoving=-1;renderStage()}pointer=null});c.addEventListener("dblclick"').replace(canvasRender,'function renderStage(){nativeRenderStage();drawBodyDraft();}function nativeRenderStage(){');
return source.replace(marker,`const nativeBodyStage='stage-42',nativeBodyAsset='act5:near:42';
let bodyDraft=[],bodyMoving=-1,bodyFill='#626256',bodyPreviewKey=null,bodyEditing=null;
function bodyTransform(){
 const s=realStage(),e=s.elements.find(e=>e.assetId===nativeBodyAsset);
 if(s.id!==nativeBodyStage||!e||e.rotation||!Number.isFinite(e.scale)||e.scale<=0)throw Error('unsupported stage/asset transform');
 return e;
}
function bodyLocal(w){
 const e=bodyTransform();return [(w.x-e.x)/e.scale,(w.y-e.y)/e.scale];
}
function bodyPointer(w,p){
 if(previewProject){toast('미리보기를 먼저 저장하거나 취소하세요');return}
 const e=bodyTransform(),q=bodyLocal(w),i=bodyDraft.findIndex(v=>Math.hypot(v[0]-q[0],v[1]-q[1])*e.scale*stageView.zoom<9);
 if(i>=0){bodyMoving=i;p.nativeBodyVertex=i;p.nativeBodyBefore=bodyDraft[i].slice();}
 else bodyDraft.push(q);
 renderStage();
}
function bodyDrag(w,p){
 if(p.nativeBodyVertex==null||previewProject)return;
 bodyDraft[p.nativeBodyVertex]=bodyLocal(w);
 renderStage();
}
function bodyUp(e,p){
 if(p.nativeBodyVertex!=null&&!previewProject){
  const w=screenToWorld(dom.stageCanvas,e.offsetX,e.offsetY,stageView);
  bodyDraft[p.nativeBodyVertex]=bodyLocal(w);
 }
 bodyMoving=-1;renderStage();
}
function bodyPreview(){
 if(previewProject||bodyDraft.length<3)return;
 try {prepareTerrainBody({points:bodyDraft,fill:bodyFill,id:bodyEditing},true);renderStage();} catch(e){toast(e.message);}
}
function bodyControls(){
 const host=document.querySelector('#stageToolbar');
 if(!host||tool!=='nativeBody'||project.activeStageId!==nativeBodyStage)return;
 let bar=host.querySelector('.body-controls');
 if(bar)return;
 bar=document.createElement('span');bar.className='body-controls';
 bar.innerHTML='<label> 암면 색 <input type="color" value="'+bodyFill+'"></label><button type="button">빈 면</button><button type="button">최근 작성면 편집</button><button type="button">미리보기</button><button type="button">저장</button><button type="button">취소</button>';
 host.appendChild(bar);
 bar.querySelector('input').onchange=e=>{bodyFill=e.target.value;};
 const [start,edit,preview,apply,cancel]=bar.querySelectorAll('button');
 start.onclick=()=>{if(!previewProject){bodyDraft=[];bodyMoving=-1;bodyEditing=null;renderStage();}};
 edit.onclick=()=>{if(previewProject)return;const f=project.library.find(a=>a.id===nativeBodyAsset)?.edgeWall?.params?.bodyEditorFaces?.at(-1);if(!f){toast('에디터로 작성한 암면이 없습니다');return;}bodyEditing=f.id;bodyFill=f.fill;bodyDraft=deep(f.points);bar.querySelector('input').value=f.fill;bodyMoving=-1;renderStage();};
 preview.onclick=bodyPreview;
 apply.onclick=()=>{if(previewProject&&previewProject===bodyPreviewKey){applyPreview();bodyPreviewKey=null;bodyDraft=[];bodyMoving=-1;bodyEditing=null;renderStage();}};
 cancel.onclick=()=>{if(previewProject&&previewProject===bodyPreviewKey){clearPreview();bodyPreviewKey=null;}bodyDraft=[];bodyMoving=-1;bodyEditing=null;renderStage();};
}
function drawBodyDraft(){
 if(tool!=='nativeBody'||project.activeStageId!==nativeBodyStage)return;
 bodyControls();
 if(!bodyDraft.length||!dom.stageOverlay?.clientWidth)return;
 const e=bodyTransform();
 const points=bodyDraft.map(([a,b])=>({x:a*e.scale+e.x,y:b*e.scale+e.y}));
 drawTransientLine(points.length>2?[...points,points[0]]:points,bodyMoving>=0?'#ffbf54':'#7cffa4');
 if(!overlayEnabled)return;
 const c=dom.stageOverlay,ctx=c.getContext('2d'),d=c._dpr||1;
 ctx.save();ctx.setTransform(d,0,0,d,0,0);
 points.forEach((p,i)=>{const a=(p.x-stageView.x)*stageView.zoom+c.clientWidth/2,b=(p.y-stageView.y)*stageView.zoom+c.clientHeight/2;ctx.fillStyle=i===bodyMoving?'#ffbf54':'#7cffa4';ctx.fillRect(a-4,b-4,8,8);});
 ctx.restore();
}
function authorTerrainBody(p){return prepareTerrainBody(p,false);}
function prepareTerrainBody({points,fill,id},preview){
 if(project.activeStageId!==nativeBodyStage||realStage().id!==nativeBodyStage||previewProject)throw Error('wrong stage or preview pending');
 const owner=project.library.find(a=>a.id===nativeBodyAsset);
 const users=project.stages.filter(s=>s.elements.some(e=>e.assetId===nativeBodyAsset));
 if(!owner?.edgeWall?.vector?.root?.clipPath||users.length!==1||users[0].id!==nativeBodyStage)throw Error('invalid or shared BODY');
 if(!/^#[0-9a-fA-F]{6}$/.test(fill)||!Array.isArray(points)||points.length<3||points.length>128||points.some(p=>!Array.isArray(p)||p.length!==2||p.some(n=>!Number.isFinite(n)))||new Set(points.map(p=>p.join(','))).size!==points.length)throw Error('invalid polygon');
 const [x,y,w,h]=owner.edgeWall.vector.viewBox;
 if(points.some(([a,b])=>a<x||b<y||a>x+w||b>y+h))throw Error('outside BODY viewBox');
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const n=points.length;
 const area=points.reduce((s,p,i)=>s+cross([0,0],p,points[(i+1)%n]),0);
 if(Math.abs(area)<1)throw Error('degenerate polygon');
 for(let i=0;i<n;i++)for(let j=i+2;j<n;j++){
  if(i===0&&j===n-1)continue;
  const [a,b,c,d]=[points[i],points[(i+1)%n],points[j],points[(j+1)%n]];
  if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)throw Error('self-intersecting polygon');
 }
 const d='M'+points.map((p)=>p.map(n=>n.toFixed(2)).join(' ')).join('L')+'Z';
 const next=deep(owner.edgeWall);
 const children=next.vector.root.children;
 const faces=(next.params??={}).bodyEditorFaces??=[];
 const rec={id:id??uid('native-body-face'),points:deep(points),fill};
 if(id!=null){const i=faces.findIndex(f=>f.id===id),j=children.findIndex(n=>n.id===id);if(i<0||j<0)throw Error('authored face not found');faces[i]=rec;children[j]={tag:'path',id:rec.id,fill,d};}
 else {faces.push(rec);children.push({tag:'path',id:rec.id,fill,d});}
 if(preview){previewCommands([{op:'asset.update',id:nativeBodyAsset,values:{edgeWall:next}}]);bodyPreviewKey=previewProject;}
 else commit('BODY 암면 그리기',()=>{owner.edgeWall=next;});

}
`+marker).replace(marker+'{',marker+'{authorTerrainBody,previewTerrainBody:p=>prepareTerrainBody(p,true),');
}
