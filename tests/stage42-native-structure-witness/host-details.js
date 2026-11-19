// Bound only inside the disposable V4 host after its exact compact basis.
function installV4DetailPanel({bar,canvas,status,baseRaw,onProject}){
 let base=null,detailRaw=null,unmount=null,latest=null,previewing=false;
 const controls=document.createElement('span');controls.setAttribute('aria-label','Native structural details');
 const message=t=>{status.detailStatus=t;toast(t)};
 const err=t=>{status.detailError=t;toast(t)};
 const applyPreview=p=>{previewing=true;previewProject=p;invalidateRuntime();renderStage()};
 const mount=async(record=[])=>{
  base=await V4D.pack.verifyStructureBaseline(baseRaw());
  if(unmount)unmount();status.detailError='';
  unmount=V4D.author.mountDetails({canvas,toolbar:controls,getCamera:()=>stageView,
   isActive:()=>currentTab==='stage'&&project.activeStageId==='stage-42-structure-witness',
   preview:d=>{applyPreview(V4D.pack.buildDetails(HonroMaps,base,d));message('상세 구조 미리보기 완료')},
   save:async d=>{
    const before=project,r=await V4D.pack.exportDetailWitness(baseRaw(),d),next=V4D.pack.buildDetails(HonroMaps,base,d);
    if(project!==before)throw Error('상세 저장 중 작업본이 변경되었습니다');
    onProject(next);detailRaw=r;previewing=false;message('상세 구조 저장 완료')
   },
   report:err,show:w=>{
    latest=w;status.detailCount=String(w.details.length);status.detailSelected=w.selected??'';
    if(previewing||!w.pending||w.pending.points.length<2)return;
    invalidateRuntime();renderStage();
    drawTransientLine(w.pending.points.map(([x,y])=>({x,y})),'#6ebac0');
   },base,record});
 };
 const button=(t,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=t;b.onclick=async e=>{if(!e.isTrusted)return;try{await fn()}catch(x){err(x.message)}};bar.append(b)};
 button('상세 작도 시작',async()=>{await mount();message('검증된 V4 원본 상세 작도 시작')});
 button('원경 없이 구조 보기',()=>{status.cleanNeutral=status.cleanNeutral==='1'?'0':'1';invalidateRuntime();renderStage()});
 button('상세 초안 내보내기',()=>{if(!detailRaw)throw Error('먼저 상세 초안을 저장하세요');download('honro-v4-native-detail-witness.json',detailRaw,'application/json')});
 const file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json';
 button('상세 초안 열기',()=>{status.detailImport='waiting';file.click()});
 file.onchange=async()=>{
  try{
   const f=file.files?.[0];if(!f||f.size>12000)throw Error('올바른 상세 초안 파일이 아닙니다');
   const raw=await f.text(),r=await V4D.pack.reopenDetailWitness(HonroMaps,baseRaw(),raw);
   onProject(r.project);detailRaw=raw;await mount(r.details);previewing=false;
   status.detailImport='opened';message('상세 초안 재열기 완료');
  }catch(x){status.detailImport='error';err(x.message)}finally{file.value=''}
 };
 bar.append(file,controls);
}
