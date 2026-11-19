// Local isolated Workshop host. Never wired to production or project release.
function blankNativeInstall(){
 const bar=document.createElement('div');bar.id='blankNativeHost';
 Object.assign(bar.style,{position:'fixed',right:'10px',bottom:'2px',zIndex:210,background:'#182024',padding:'4px'});
 const canvas=document.querySelector('#stageCanvas'),readSource=()=>HONRO_PROJECT;
 if(!canvas)throw Error('Missing stock Workshop stage canvas');
 const status=document.documentElement.dataset;
 let base=null,design=null,mode='off',seam=null,dummy=null,selectedPoint=null,preview=null,draft=null,busy=false,showGuide=false;
 const active=()=>base&&currentTab==='stage'&&project.activeStageId===IDS.draft;
 const report=s=>{status.cleanStatus=s;toast(s)};
 const sync=()=>{status.cleanMode=mode;status.cleanCounts=JSON.stringify([design?.outline.length??0,design?.seams.length??0,design?.dummies.length??0]);};
 const need=(v,s)=>{if(!v)throw Error(s)};
 const paint=()=>{
  previewProject=preview;invalidateRuntime();renderStage();
  renderAuthorLines();
  sync();
 };
 function renderAuthorLines(){
  if(showGuide&&base)for(const t of base.baseline.terrainCollision){
   const points=t.control??t.points??[];
   if(points.length>1)drawTransientLine(points,'#dbbf7c');
  }
  if(!design||preview)return;
  const lines=[design.outline,...design.seams.map(s=>[design.outline[s.a],...s.knots,design.outline[s.b]]),...(seam?[[design.outline[seam.a],...seam.knots]]:[]),...design.dummies,...(dummy?[dummy]:[])];
  for(const points of lines)if(points.length>1)drawTransientLine(points.map(([x,y])=>({x,y})),'#6cc8e0');
 }
 const set=(next)=>{project=next;preview=previewProject=null;selected=null;selectedAssetId=next.library[0]?.id;history=[];future=[];currentTab='stage';invalidateRuntime();renderAll();sync()};
 const button=(name,action)=>{const b=document.createElement('button');b.type='button';b.textContent=name;
  b.onclick=async e=>{if(!e.isTrusted||busy)return;busy=true;try{await action();sync()}catch(error){report(error.message)}finally{busy=false}};
  bar.append(b);};
 const closest=q=>{
  const hit=(p)=>Math.hypot(q[0]-p[0],q[1]-p[1])*stageView.zoom;
  return design.outline.map((p,i)=>({i,d:hit(p)})).filter(w=>w.d<12).sort((a,b)=>a.d-b.d)[0]?.i;
 };
 const grid=e=>{const b=canvas.getBoundingClientRect();return [Math.round(stageView.x+(e.clientX-b.left-b.width/2)/stageView.zoom),Math.round(stageView.y+(e.clientY-b.top-b.height/2)/stageView.zoom)]};
 canvas.addEventListener('pointerdown',e=>{
  if(!active()||busy||!e.isTrusted||e.button!==0||!e.isPrimary||mode==='closed')return;
  e.stopImmediatePropagation();
  try{
   preview=null;const q=grid(e);
   if(mode==='outline')design.outline.push(q);
   else if(mode==='seam-start'){
    const i=closest(q);need(Number.isInteger(i),'외곽의 기존 점을 선택하세요');seam={a:i,b:null,knots:[]};mode='seam-knots';
   }else if(mode==='seam-knots')seam.knots.push(q);
   else if(mode==='seam-end'){
    const i=closest(q);need(Number.isInteger(i)&&i!==seam.a,'외곽의 다른 끝점을 선택하세요');
    seam.b=i;design.seams.push(seam);seam=null;mode='outline-done';
   }else if(mode==='dummy'){
    const i=closest(q);dummy.push(Number.isInteger(i)?[...design.outline[i]]:q);
   }else if(mode==='edit'){
    const i=closest(q);need(Number.isInteger(i),'편집할 외곽 점을 선택하세요');
    selectedPoint=i;canvas.setPointerCapture?.(e.pointerId);
   }
   paint();
  }catch(error){report(error.message)}
 },true);
 canvas.addEventListener('pointerup',e=>{
  if(!active()||selectedPoint===null||!e.isTrusted||!e.isPrimary)return;
  e.stopImmediatePropagation();
  const i=selectedPoint, q=grid(e), old=structuredClone(design), prev=design.outline[i];selectedPoint=null;
  design.outline[i]=q;
  for(const ps of design.dummies)for(let j=0;j<ps.length;j++)if(ps[j][0]===prev[0]&&ps[j][1]===prev[1])ps[j]=[...q];
  try{compileNativeDraft(design);paint()}catch(error){design=old;paint();report(error.message)}
 },true);
 canvas.addEventListener('pointercancel',()=>{selectedPoint=null},true);
 button('빈 5막 2장 작업본',()=>{
  base=createBlankWorkshopStage(readSource());design=structuredClone(base.design);mode='outline';seam=dummy=draft=null;
  showGuide=false;set(blankProject(HonroMaps,base));report('빈 지형: 경로 0개');
 });
 button('충돌 가이드 표시/숨기기',()=>{need(active(),'먼저 신규 작업본을 여세요');showGuide=!showGuide;paint()});
 button('실루엣 닫기',()=>{need(active()&&mode==='outline'&&design.outline.length>=8,'먼저 외곽을 그리세요');mode='outline-done';paint()});
 button('새 공유 절리',()=>{need(active()&&mode==='outline-done'&&design.seams.length<2,'외곽을 닫거나 이전 절리를 마치세요');mode='seam-start'});
 button('절리 끝점 선택',()=>{need(active()&&mode==='seam-knots','먼저 절리 시작점을 선택하세요');mode='seam-end'});
 button('새 비충돌 외곽',()=>{need(active()&&mode==='outline-done'&&design.seams.length===2,'공유 절리 두 개가 필요합니다');dummy=[];mode='dummy'});
 button('비충돌 외곽 닫기',()=>{need(active()&&mode==='dummy'&&dummy.length>=3,'비충돌 외곽 점이 부족합니다');const edited={...design,dummies:[...design.dummies,dummy]};compileNativeDraft(edited);design=edited;dummy=null;mode='edit';paint()});
 button('신규 지형 미리보기',()=>{need(active()&&mode==='edit','신규 지형을 먼저 완성하세요');preview=composeBlankProject(HonroMaps,base,design);paint();report('신규 지형 미리보기: 작업본 미변경')});
 button('신규 초안 저장',async()=>{
  need(active()&&mode==='edit','신규 지형을 먼저 완성하세요');const prev=project;
  const next=composeBlankProject(HonroMaps,base,design),raw=await exportBlankDraft(base,design);
  need(project===prev,'저장 중 작업본이 바뀌었습니다');set(next);draft=raw;report('신규 초안 저장 완료');
 });
 button('신규 초안 내보내기',()=>{need(active()&&draft,'먼저 신규 초안을 저장하세요');download('honro-stage42-clean-draft.json',draft,'application/json')});
 const input=document.createElement('input');input.type='file';input.hidden=true;input.accept='.json';
 button('신규 초안 열기',()=>{status.cleanImport='waiting';input.click()});
 input.onchange=async()=>{
  try{
   const f=input.files?.[0];need(f&&f.size<=12000,'올바른 신규 초안 파일이 아닙니다');
   const raw=await f.text(),r=await reopenBlankDraft(HonroMaps,readSource(),raw);
   base=r.base;design=r.design;mode='edit';set(r.next);draft=raw;status.cleanImport='opened';report('새 작업본에서 초안 재열기 완료');
  }catch(error){status.cleanImport='error';report(error.message)}finally{input.value=''}
 };
 bar.append(input);document.body.append(bar);
}
setTimeout(blankNativeInstall,0);
