// Isolated Full Stage42 Workshop, built from the V2 disposable host patterns.
// Works only from blank or manually reopened native draft; no old library use.
function mountFullHost(){
 const html=document.documentElement,status=html.dataset,canvas=document.querySelector('#stageCanvas'),bar=document.createElement('div');
 if(!canvas)return;
 bar.id='nativeFull42Host';bar.setAttribute('aria-label','Full Stage 42 native terrain authoring');
 Object.assign(bar.style,{position:'fixed',right:'8px',bottom:'5px',zIndex:210,background:'#182024',padding:'4px'});
 let raw=null,unmount=null,preview=null;
 const badge=document.createElement('span');badge.style.color='#e0e5e8';badge.setAttribute('aria-live','polite');bar.append(badge);
 const msg=(key,s)=>{status[key]=s;toast(s)};
 const error=s=>msg('full42Error',s),success=s=>msg('full42Status',s);
 const button=(text,cb)=>{
  const x=document.createElement('button');x.type='button';x.textContent=text;x.onclick=async e=>{if(!e.isTrusted)return;try{await cb()}catch(e){error(e.message)}};bar.append(x);
 };
 function install(next){
  project=next;previewProject=preview=null;history=[];future=[];selected=null;selectedAssetId=next.library[0]?.id;stageView._fit=false;switchTab('stage');
 }
 function read(x){
  status.full42Phase=x.phase;badge.textContent=x.phase;
  invalidateRuntime();renderStage();
  if(preview||x.phase==='edit')return;
  const d=x.design,series=[...d.sections.flatMap(r=>[r.top,r.bottom]),d.upper.top,d.upper.bottom,...d.back,...d.margins.map(m=>m.points),
   ...d.joins.map(j=>[j.top,j.bottom].filter(Boolean)),...d.bearings.flatMap(r=>[r.head,r.toe,...r.sides])];
  for(const p of series)if(p.length>1)drawTransientLine(p.map(([x,y])=>({x,y})),'#78bfcb');
 }
 const mount=(record=null)=>{
  if(unmount)unmount();
  unmount=mountFullAuthor({canvas,controls:bar,getCamera:()=>stageView,
   isActive:()=>currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout',
   read,report:error,record,
   preview:d=>{preview=fullWorkshopProject(HonroMaps,d);previewProject=preview;invalidateRuntime();renderStage();success('전체 지형 미리보기 완료')},
   save:d=>{const next=fullWorkshopProject(HonroMaps,d),envelope=exportFullWorkshop(d);install(next);raw=envelope;success('전체 지형 초안 수동 저장 완료')}
  });
 };
 button('빈 전체 지형 작업본',()=>{
  status.cleanNeutral='1';raw=null;install(fullBlankProject(HonroMaps));mount();success('전체 신규 장: 시각 자산 0개');
 });
 button('전체 초안 내보내기',()=>{if(!raw)throw Error('전체 초안을 먼저 저장하세요');download('honro-stage42-full-native.json',raw,'application/json')});
 button('원경 없이 전체 보기',()=>{status.cleanNeutral=status.cleanNeutral==='1'?'0':'1';invalidateRuntime();renderStage()});
 const file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json';
 button('전체 초안 열기',()=>{status.full42Import='waiting';file.click()});
 file.onchange=async()=>{
  try{
   const f=file.files?.[0];if(!f||f.size>28000)throw Error('Invalid native file size');
   const s=await f.text(),r=reopenFullWorkshop(HonroMaps,s);
   status.cleanNeutral='1';install(r.project);raw=s;mount(r.design);status.full42Import='opened';success('전체 초안 정확 재열기 완료');
  }catch(e){status.full42Import='error';error(e.message)}finally{file.value=''}
 };
 bar.append(file);document.body.append(bar);
}
setTimeout(mountFullHost,0);
