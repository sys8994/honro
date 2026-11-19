import fs from 'node:fs';
import {maskContainsStrict} from './guard.mjs';
import {facePath} from './curve.mjs';
import {compileJoint,compileWorkshopJoint} from './joint.mjs';

export function installEditor(source){
 const visibleGuard=JSON.parse(fs.readFileSync(new URL('./visible-guard.json',import.meta.url)));
 const seams={
  marker:'window.HonroWorkshopAPI=',
  toolbar:'[["select","선택"],["terrain","지형"],["solid","Solid"],["material","재질"],["place","배치"],["scatter","Scatter"],["unit","유닛"],["event","이벤트"],["pan","Pan"]]',
  down:'if(tool==="terrain"){drawStroke=[w];return}',
  move:'if(tool==="terrain"&&drawStroke.length){',
  up:'function stagePointerUp(e,p){',
  render:'function renderStage(){',
  cancel:'pointer=null});c.addEventListener("dblclick"'
 };
 for(const k of Object.values(seams))if(source.split(k).length!==2)throw Error('missing/ambiguous pinned Workshop seam '+k);
 source=source.replace(seams.toolbar,seams.toolbar+'.concat(project.activeStageId==="stage-42"?[["nativeJoint","공유 절리"]]:[])')
 .replace(seams.down,'if(tool==="nativeJoint"){jointDown(w,p);return}'+seams.down)
 .replace(seams.move,'if(tool==="nativeJoint"){jointDrag(w,p);return}'+seams.move)
 .replace(seams.up,seams.up+'if(tool==="nativeJoint"&&!p.pan){jointUp(e,p);return;}')
 .replace(seams.cancel,'pointer=null});c.addEventListener("pointercancel",()=>{if(kind==="stage"&&pointer?.nativeLedge&&ledgeDraft){ledgeDraft.points[pointer.ledgeIndex]=pointer.ledgeBefore;ledgeMoving=-1;renderStage()}else if(kind==="stage"&&pointer?.nativeRim){rimDragPoint=null;renderStage()}else if(kind==="stage"&&pointer?.nativeJoint){jointDragPoint=null;renderStage()} pointer=null});c.addEventListener("dblclick"')
 .replace(seams.render,'function renderStage(){baseJointRenderStage();renderJointControls();}function baseJointRenderStage(){');
 return source.replace(seams.marker,`
 const jointPath=${facePath.toString()}, jointBuild=${compileJoint.toString()}, jointCompile=${compileWorkshopJoint.toString()}, jointGuard=${JSON.stringify(visibleGuard)};
 let jointClicks=[],rimClicks=[],rimEnd=-1,rimClosed=false,rimDragPoint=null,jointDragPoint=null,jointToolPreview=null,jointMaterial='slate',jointSide='left',ledgeDraft=null,ledgeMoving=-1,ledgeMaterial='shelf';
 const jointOwner=()=>project.library.find(a=>a.id==='act5:near:42');
 const jointState=()=>jointOwner()?.edgeWall?.params?.workshopVisibleJoint42;
 const draftKind='honro-stage42-visible-rim-v4', draftMax=8192;
 function exactKeys(v,keys){return v!=null&&typeof v==='object'&&!Array.isArray(v)&&Object.keys(v).length===keys.length&&keys.every(k=>Object.hasOwn(v,k));}
 function targetJoint(p){
  const a=p.library.filter(a=>a.id==='act5:near:42'), users=p.stages.filter(st=>st.elements.some(e=>e.assetId==='act5:near:42'));
  if(p.activeStageId!=='stage-42'||a.length!==1||users.length!==1||users[0].id!=='stage-42')throw Error('wrong stage or shared asset');
  return a[0];
 }
 function jointBase(p){
  const q=deep(p),own=targetJoint(q),base=own.edgeWall,st=base.params.workshopVisibleJoint42;
  if(st){base.vector.root=st.originalRoot;delete base.vector.clips['editor-visible-support'];delete base.params.workshopVisibleJoint42;}
  delete own.edgeWall;
  return [JSON.stringify(q),JSON.stringify(base)];
 }
 const actualMaskContains=${maskContainsStrict.toString()};
 let ledgeMaskContext=null,ledgeMaskPath=null,sourceMaskPath=null,sourceMaskData=null;
 function withinLedgeGuard(points){
  ledgeMaskContext??=document.createElement('canvas').getContext('2d');
  ledgeMaskPath??=new Path2D(jointGuard.join(' '));
  const geometry=jointOwner().edgeWall.vector.clips['native-source-alpha'];
  if(JSON.stringify(geometry)!==sourceMaskData){sourceMaskData=JSON.stringify(geometry);sourceMaskPath=new Path2D(geometry.join(' '));}
  return actualMaskContains(jointGuard,points,(x,y)=>ledgeMaskContext.isPointInPath(ledgeMaskPath,x,y,'nonzero'))&&
   actualMaskContains(geometry,points,(x,y)=>ledgeMaskContext.isPointInPath(sourceMaskPath,x,y,'nonzero'));
 }

 function jointCandidate(edit){
  const owner=targetJoint(project),next=deep(project);
  targetJoint(next).edgeWall=jointCompile(owner,edit,jointPath,jointBuild,jointGuard,3938422908,'native-source-alpha',withinLedgeGuard).edgeWall;
  if(jointBase(project).some((s,i)=>jointBase(next)[i]!==s))throw Error('Joint edit escaped asset ownership');
  const errors=p=>HonroMaps.validate(p).filter(x=>x.level==='err').map(x=>JSON.stringify(x));
  const before=errors(project);
  for(const e of errors(next)){const i=before.indexOf(e);if(i<0)throw Error('Shared joint introduces a validation error');before.splice(i,1);}
  return next;
 }
 function saveJoint(next){
  if(jointBase(project).some((s,i)=>jointBase(next)[i]!==s))throw Error('Stale joint edit');
  const before=deep(project);project=next;history.push({label:'공유 절리 편집',state:before});if(history.length>80)history.shift();
  future=[];previewProject=null;previewCommandsKey=null;jointToolPreview=null;invalidateRuntime();
  const saved=saveAutosave();renderAll();setStatus(saved?'공유 절리 초안 저장':autosaveFailureMessage());
 }
 function applyJointPreview(){
  if(!jointToolPreview||previewProject!==jointToolPreview)throw Error('No shared joint preview');
  saveJoint(previewProject);
 }
 function previewNativeJoint(edit){
  if(realStage().id!=='stage-42'||previewProject)throw Error('wrong stage or preview in progress');
  previewProject=jointCandidate(edit);jointToolPreview=previewProject;previewCommandsKey=null;invalidateRuntime();renderStage();
 }
 async function jointSHA(text){return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
 async function exportJointDraft(){
  if(previewProject)throw Error('Resolve shared joint preview first');
  const p=project,s=targetJoint(p).edgeWall.params.workshopVisibleJoint42;
  if(!s)throw Error('No shared joint data');
  const [baseProjectSha256,baseBodySha256]=await Promise.all(jointBase(p).map(jointSHA));
  const raw=JSON.stringify({kind:draftKind,stageId:'stage-42',assetId:'act5:near:42',baseProjectSha256,baseBodySha256,section:{rim:s.rim,end:s.end,chain:s.chain,materials:s.materials,ledges:s.ledges}});
  if(p!==project||previewProject)throw Error('Joint source changed while exporting');
  return raw;
 }
 async function importJointDraft(raw){
  if(previewProject||typeof raw!=='string'||new TextEncoder().encode(raw).length>draftMax)throw Error('Invalid shared joint draft file');
  const doc=JSON.parse(raw),sh=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
  if(!exactKeys(doc,['kind','stageId','assetId','baseProjectSha256','baseBodySha256','section'])||doc.kind!==draftKind||doc.stageId!=='stage-42'||doc.assetId!=='act5:near:42'||![doc.baseProjectSha256,doc.baseBodySha256].every(sh)||!exactKeys(doc.section,['rim','end','chain','materials','ledges']))throw Error('Invalid shared joint envelope');
  const p=project;
  if(targetJoint(p).edgeWall.params.workshopVisibleJoint42)throw Error('Open into a fresh base project');
  const texts=jointBase(p),[a,b]=await Promise.all(texts.map(jointSHA));
  if(project!==p||previewProject||jointBase(project).some((v,i)=>v!==texts[i]))throw Error('Joint base changed while opening');
  if(doc.baseProjectSha256!==a||doc.baseBodySha256!==b)throw Error('Joint draft was saved from a different base');
  saveJoint(jointCandidate({op:'joint.create',...doc.section}));
 }
 function jointElement(){
  const a=realStage().elements.find(e=>e.assetId==='act5:near:42');
  if(!a||a.rotation||!Number.isFinite(a.scale)||a.scale<=0)throw Error('invalid workshop coordinates');
  return a;
 }
 function jointLocal(w){const e=jointElement(); return [(w.x-e.x)/e.scale,(w.y-e.y)/e.scale];}
 function jointWorld(q){const e=jointElement();return {x:q[0]*e.scale+e.x,y:q[1]*e.scale+e.y};}
 function jointDown(w,p){
  if(previewProject)return;
  const q=jointLocal(w),s=jointState();
  if(s&&ledgeDraft){
   const z=jointElement().scale*stageView.zoom;
   const hit=ledgeDraft.points.findIndex(a=>Math.hypot(q[0]-a[0],q[1]-a[1])*z<10);
   if(hit>=0){p.nativeLedge=true;p.ledgeIndex=hit;p.ledgeBefore=ledgeDraft.points[hit].slice();ledgeMoving=hit;}
   else if(ledgeDraft.points.length<12)ledgeDraft.points.push(q);
   renderStage();return;
  }
  if(s){
   const z=jointElement().scale*stageView.zoom;
   const rimHit=s.rim.map(([x,y],i)=>({i,d:Math.hypot(q[0]-x,q[1]-y)*z})).filter(o=>o.d<10).sort((a,b)=>a.d-b.d)[0];
   const hit=s.chain.map(([x,y],i)=>({i,d:Math.hypot(q[0]-x,q[1]-y)*z})).filter(o=>o.d<12).sort((a,b)=>a.d-b.d)[0];
   if(rimHit&&(!hit||rimHit.d<=hit.d)){
    if(rimHit.i===0||rimHit.i===s.end){toast('절리 양끝은 고정입니다');return;}
    p.nativeRim=true;p.rimIndex=rimHit.i;rimDragPoint={i:rimHit.i,q:s.rim[rimHit.i]};return;
   }
   if(hit){p.nativeJoint=true;p.jointFrom=jointSide;p.anchorIndex=hit.i;jointDragPoint={i:hit.i,q:s.chain[hit.i]};}
   return;
  }
  if(!rimClosed){
   if(rimClicks.length>=32){toast('외곽은 최대 32점입니다');return;}
   rimClicks.push(q);renderStage();return;
  }
  if(jointClicks.length>=16){toast('절리점은 최대 16개입니다');return;}
  jointClicks.push(q);renderStage();
 }
 function markRimEnd(){
  if(rimClosed||rimClicks.length<2||rimEnd>=0)throw Error('외곽에 절리 끝점을 찍은 뒤 지정하세요');
  rimEnd=rimClicks.length-1;
 }
 function closeRim(){
  if(rimClosed||rimClicks.length<3||rimEnd<1)throw Error('외곽과 절리 끝점을 먼저 지정하세요');
  jointPath(rimClicks.map(point=>({point})),jointOwner().edgeWall.vector.viewBox);
  if(!withinLedgeGuard(rimClicks))throw Error('외곽이 원본 암벽 또는 잠긴 가시 영역을 벗어납니다');
  rimClosed=true;
 }
 function previewRim(){
  if(!rimClosed||!jointClicks.length)throw Error('외곽을 닫고 절리점 하나 이상을 찍으세요');
  previewNativeJoint({op:'joint.create',rim:rimClicks,end:rimEnd,chain:jointClicks,materials:{left:jointMaterial,right:'ledge'}});
 }
 function clearRimDraft(){jointClicks=[];rimClicks=[];rimEnd=-1;rimClosed=false;ledgeDraft=null;}
 function jointDrag(w,p){if(p.nativeRim&&!previewProject){rimDragPoint={i:p.rimIndex,q:jointLocal(w)};renderStage();return;}if(p.nativeLedge&&ledgeDraft&&!previewProject){ledgeDraft.points[p.ledgeIndex]=jointLocal(w);renderStage();return;}if(p.nativeJoint&&!previewProject){jointDragPoint={i:p.anchorIndex,q:jointLocal(w)};renderStage();}}
 function jointUp(e,p){
  if(p.nativeLedge){ledgeMoving=-1;renderStage();return;}
  if(p.nativeRim&&!previewProject){
   const i=p.rimIndex,q=jointLocal(screenToWorld(dom.stageCanvas,e.offsetX,e.offsetY,stageView));
   rimDragPoint=null;
   if(Math.hypot(...q.map((x,j)=>x-jointState().rim[i][j]))>=.001)
    try{previewNativeJoint({op:'rim.move',rimIndex:i,selectedFrom:jointSide,point:q});}catch(e){toast(e.message);}
   renderStage();return;
  }
  if(!p.nativeJoint||previewProject)return;
  const q=jointLocal(screenToWorld(dom.stageCanvas,e.offsetX,e.offsetY,stageView)),i=p.anchorIndex;
  jointDragPoint=null;
  if(Math.hypot(...q.map((x,j)=>x-jointState().chain[i][j]))<.001){renderStage();return;}
  try{previewNativeJoint({op:'joint.move',selectedFrom:p.jointFrom,anchorIndex:i,point:q});}catch(e){toast(e.message);}
  renderStage();
 }
 function startLedge(){
  if(previewProject||!jointState())throw Error('부모 암면을 먼저 저장하세요');
  ledgeDraft={id:uid('ledge'),parent:jointSide,points:[],material:ledgeMaterial};
 }
 function previewLedge(){
  if(!ledgeDraft)throw Error('먼저 침식턱을 작성하세요');
  previewNativeJoint({op:'ledge.put',id:ledgeDraft.id,selectedFrom:ledgeDraft.parent,points:ledgeDraft.points,material:ledgeDraft.material});
 }
 function reopenLedge(id){
  if(!previewProject){const chosen=jointState().ledges.find(f=>f.id===id);ledgeDraft=chosen?deep(chosen):null;renderStage();}
 }
 function renderJointControls(){
  if(tool!=='nativeJoint'||project.activeStageId!=='stage-42')return;
  const h=document.querySelector('#stageToolbar');if(!h)return;
  let bar=h.querySelector('.joint-controls');
  if(!bar){
   bar=document.createElement('span');bar.className='joint-controls';h.appendChild(bar);
   const material=document.createElement('select');material.setAttribute('aria-label','암층 재질');bar.appendChild(material);
   for(const [id,text] of [['slate','편암'],['ledge','밝은 절리면'],['fracture','침식층'],['root','뿌리층']]){const opt=document.createElement('option');opt.value=id;opt.textContent=text;material.appendChild(opt);}
   material.value=jointMaterial;material.onchange=()=>{jointMaterial=material.value;};
   const help=document.createElement('small');help.textContent='시작점 → 외곽을 시계 방향으로 → 끝점 지정 → 외곽 닫기 → 절리점';bar.appendChild(help);
   const side=document.createElement('select');side.setAttribute('aria-label','편집 암면');bar.appendChild(side);
   for(const [id,label] of [['left','왼쪽 암면'],['right','오른쪽 암면']]){const opt=document.createElement('option');opt.value=id;opt.textContent=label;side.appendChild(opt);}
   side.value=jointSide;side.onchange=()=>{jointSide=side.value;ledgeDraft=null;renderStage();};

   for(const [id,label,fn] of [
    ['rim-end','절리 끝점 지정',markRimEnd],
    ['rim-close','외곽 닫기',closeRim],
    ['preview','절리 미리보기',previewRim],
    ['ledge-new','빈 침식턱',startLedge],
    ['ledge-preview','침식턱 미리보기',previewLedge],
    ['material','선택 암면 재질 적용',()=>previewNativeJoint({op:'joint.material',selectedFrom:jointSide,material:jointMaterial})],
    ['apply','공유 절리 저장',()=>{applyJointPreview();clearRimDraft();}],
    ['cancel','취소',()=>{if(previewProject&&previewProject===jointToolPreview)clearPreview();clearRimDraft();}],
    ['reset','원래 도색 복구',()=>previewNativeJoint({op:'joint.reset'})],
   ]){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.jointAction=id;
    b.onclick=()=>{try{fn();renderStage();}catch(e){toast(e.message);}};bar.appendChild(b);
   }
   const raw=document.createElement('input');raw.type='file';raw.accept='.json,application/json';raw.hidden=true;bar.appendChild(raw);
   const data=document.documentElement.dataset;
   for(const [id,text,fn] of [
    ['download','절리 초안 내보내기',async()=>{const payload=await exportJointDraft();const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='stage42-guarded-section.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}],
    ['open','절리 초안 열기',async()=>{data.jointDraft='waiting-file';raw.click();}]
   ]){
    const b=document.createElement('button');b.type='button';b.textContent=text;b.dataset.jointAction=id;bar.appendChild(b);b.onclick=()=>fn().catch(e=>toast(e.message));
   }
   raw.onchange=async()=>{const f=raw.files?.[0];raw.value='';if(!f)return;try{if(f.size>draftMax)throw Error('Draft too large');data.jointDraft='validating';await importJointDraft(await f.text());data.jointDraft='opened';}catch(e){data.jointDraft='failed';data.jointDraftError=e.message;toast(e.message);}};
  }
  const s=jointState();
  if(!s){
   if(rimClicks.length>1)drawTransientLine((rimClosed?[...rimClicks,rimClicks[0]]:rimClicks).map(jointWorld),'#a3a6b0');
   if(jointClicks.length)drawTransientLine([rimClicks[0],...jointClicks,rimClicks[rimEnd]].map(jointWorld),'#7cffa4');
   return;
  }
  let ledgeChoice=bar.querySelector('[aria-label="침식턱 선택"]');
  if(!ledgeChoice){
   ledgeChoice=document.createElement('select');ledgeChoice.setAttribute('aria-label','침식턱 선택');bar.appendChild(ledgeChoice);
   ledgeChoice.onchange=()=>reopenLedge(ledgeChoice.value);
  }
  const choices=s.ledges.filter(f=>f.parent===jointSide);
  ledgeChoice.replaceChildren(...[['','침식턱 다시 편집'],...choices.map((f,i)=>[f.id,'침식턱 '+(i+1)])].map(([id,label])=>{const op=document.createElement('option');op.value=id;op.textContent=label;return op;}));
  ledgeChoice.value=choices.some(f=>f.id===ledgeDraft?.id)?ledgeDraft.id:'';
  if(ledgeDraft?.points.length){
   const line=ledgeDraft.points.length>2?[...ledgeDraft.points,ledgeDraft.points[0]]:ledgeDraft.points;
   drawTransientLine(line.map(jointWorld),'#ffdca6');
  }
  const rim=(jointToolPreview?.library?.find(a=>a.id==='act5:near:42')?.edgeWall?.params?.workshopVisibleJoint42?.rim??s.rim).map((p,i)=>rimDragPoint?.i===i?rimDragPoint.q:p);
  const N=rim[0],S=rim[s.end],chain=s.chain.map((pt,i)=>jointDragPoint?.i===i?jointDragPoint.q:pt);
  drawTransientLine([...rim,N].map(jointWorld),'#a3a6b0');
  drawTransientLine([N,...chain,S].map(jointWorld),'#7cffa4');
  const c=dom.stageOverlay;if(!c?.clientWidth||!overlayEnabled)return;
  const ctx=c.getContext('2d'),d=c._dpr||1;
  ctx.save();ctx.setTransform(d,0,0,d,0,0);
  for(const [i,p] of rim.entries()){
   const u=jointWorld(p);ctx.fillStyle=i===0||i===s.end?'#fc857a':rimDragPoint?.i===i?'#fff':'#a3a6b0';
   ctx.fillRect((u.x-stageView.x)*stageView.zoom+c.clientWidth/2-3,(u.y-stageView.y)*stageView.zoom+c.clientHeight/2-3,6,6);
  }
  for(const [i,q] of chain.entries()){
   const u=jointWorld(q);ctx.fillStyle=jointDragPoint?.i===i?'#fff2ba':'#ffca57';
   ctx.fillRect((u.x-stageView.x)*stageView.zoom+c.clientWidth/2-4,(u.y-stageView.y)*stageView.zoom+c.clientHeight/2-4,8,8);
  }
  for(const [i,p] of (ledgeDraft?.points??[]).entries()){
   const u=jointWorld(p);ctx.fillStyle=ledgeMoving===i?'#fff':'#ffdca6';
   ctx.fillRect((u.x-stageView.x)*stageView.zoom+c.clientWidth/2-3,(u.y-stageView.y)*stageView.zoom+c.clientHeight/2-3,6,6);
  }
  ctx.restore();
 }
 `+seams.marker).replace(seams.marker+'{',seams.marker+'{previewNativeJoint,applyJointPreview,exportJointDraft,importJointDraft,');
}
