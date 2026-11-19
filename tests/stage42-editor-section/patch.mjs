import fs from 'node:fs';
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
 .replace(seams.cancel,'pointer=null});c.addEventListener("pointercancel",()=>{if(kind==="stage"&&pointer?.nativeJoint){jointDragPoint=null;renderStage()} pointer=null});c.addEventListener("dblclick"')
 .replace(seams.render,'function renderStage(){baseJointRenderStage();renderJointControls();}function baseJointRenderStage(){');
 return source.replace(seams.marker,`
 const jointPath=${facePath.toString()}, jointBuild=${compileJoint.toString()}, jointCompile=${compileWorkshopJoint.toString()}, jointGuard=${JSON.stringify(visibleGuard)};
 let jointClicks=[],jointDragPoint=null,jointToolPreview=null,jointMaterial='slate';
 const jointOwner=()=>project.library.find(a=>a.id==='act5:near:42');
 const jointState=()=>jointOwner()?.edgeWall?.params?.workshopVisibleJoint42;
 const draftKind='honro-stage42-visible-joint-v1', draftMax=8192;
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
 function jointCandidate(edit){
  const owner=targetJoint(project),next=deep(project);
  targetJoint(next).edgeWall=jointCompile(owner,edit,jointPath,jointBuild,jointGuard,3938422908,'native-source-alpha').edgeWall;
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
  const raw=JSON.stringify({kind:draftKind,stageId:'stage-42',assetId:'act5:near:42',baseProjectSha256,baseBodySha256,section:{rim:s.rim,anchor:s.anchor,material:s.material}});
  if(p!==project||previewProject)throw Error('Joint source changed while exporting');
  return raw;
 }
 async function importJointDraft(raw){
  if(previewProject||typeof raw!=='string'||new TextEncoder().encode(raw).length>draftMax)throw Error('Invalid shared joint draft file');
  const doc=JSON.parse(raw),sh=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
  if(!exactKeys(doc,['kind','stageId','assetId','baseProjectSha256','baseBodySha256','section'])||doc.kind!==draftKind||doc.stageId!=='stage-42'||doc.assetId!=='act5:near:42'||![doc.baseProjectSha256,doc.baseBodySha256].every(sh)||!exactKeys(doc.section,['rim','anchor','material']))throw Error('Invalid shared joint envelope');
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
  if(s){
   const z=jointElement().scale*stageView.zoom;
   if(Math.hypot(q[0]-s.anchor[0],q[1]-s.anchor[1])*z<15){p.nativeJoint=true;p.jointFrom=q[0]<=s.anchor[0]?'left':'right';jointDragPoint=s.anchor.slice();}
   return;
  }
  jointClicks.push(q);
  if(jointClicks.length===5){
   const [N,E,S,W,anchor]=jointClicks;
   jointClicks=[];
   try{previewNativeJoint({op:'joint.create',rim:[N,E,S,W],anchor,material:jointMaterial});}catch(e){toast(e.message);}
  }
  renderStage();
 }
 function jointDrag(w,p){if(p.nativeJoint&&!previewProject){jointDragPoint=jointLocal(w);renderStage();}}
 function jointUp(e,p){
  if(!p.nativeJoint||previewProject)return;
  const q=jointLocal(screenToWorld(dom.stageCanvas,e.offsetX,e.offsetY,stageView));
  jointDragPoint=null;
  if(Math.hypot(...q.map((x,i)=>x-jointState().anchor[i]))<.001)return;
  try{previewNativeJoint({op:'joint.move',selectedFrom:p.jointFrom,anchorKey:'rock-seam',anchor:q});}catch(e){toast(e.message);}
  renderStage();
 }
 function renderJointControls(){
  if(tool!=='nativeJoint'||project.activeStageId!=='stage-42')return;
  const h=document.querySelector('#stageToolbar');if(!h)return;
  let bar=h.querySelector('.joint-controls');
  if(!bar){
   bar=document.createElement('span');bar.className='joint-controls';h.appendChild(bar);
   const material=document.createElement('select');material.setAttribute('aria-label','암층 재질');bar.appendChild(material);
   for(const [id,text] of [['slate','편암'],['fracture','침식층'],['root','뿌리층']]){const opt=document.createElement('option');opt.value=id;opt.textContent=text;material.appendChild(opt);}
   material.value=jointMaterial;material.onchange=()=>{jointMaterial=material.value;};
   const help=document.createElement('small');help.textContent='위·오른쪽·아래·왼쪽 외곽 → 절리점';bar.appendChild(help);

   for(const [id,label,fn] of [
    ['apply','공유 절리 저장',()=>{applyJointPreview();}],
    ['cancel','취소',()=>{if(previewProject&&previewProject===jointToolPreview)clearPreview();jointClicks=[];}],
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
  if(!s){if(jointClicks.length>1)drawTransientLine((jointClicks.length===4?[...jointClicks,jointClicks[0]]:jointClicks).map(jointWorld),'#7cffa4');return;}
  const [N,,S]=s.rim,q=jointDragPoint??s.anchor;
  drawTransientLine([...s.rim,s.rim[0]].map(jointWorld),'#a3a6b0');
  drawTransientLine([N,q,S].map(jointWorld),'#7cffa4');
  const c=dom.stageOverlay;if(!c?.clientWidth||!overlayEnabled)return;
  const u=jointWorld(q),ctx=c.getContext('2d'),d=c._dpr||1;
  ctx.save();ctx.setTransform(d,0,0,d,0,0);ctx.fillStyle='#ffca57';
  ctx.fillRect((u.x-stageView.x)*stageView.zoom+c.clientWidth/2-4,(u.y-stageView.y)*stageView.zoom+c.clientHeight/2-4,8,8);
  ctx.restore();
 }
 `+seams.marker).replace(seams.marker+'{',seams.marker+'{previewNativeJoint,applyJointPreview,exportJointDraft,importJointDraft,');
}
