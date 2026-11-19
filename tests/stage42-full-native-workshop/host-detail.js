// Local bind after canonical, exact full-width Workshop base was accepted.
function installWholeDetail({bar,status,canvas,baseRaw,onProject}){
 let b=null,r=null,dispose=null,previewing=false;
 const controls=document.createElement('span');controls.id='full42DetailControls';controls.setAttribute('aria-label','Full stage detail authoring');
 const message=(k,s)=>{status[k]=s;toast(s)};
 const err=s=>message('wholeDetailError',s),ok=s=>message('wholeDetailStatus',s);
 const mount=async(records=[])=>{
  b=await FD.pack.verifiedWholeBase(HonroMaps,baseRaw());status.full42DetailMode='1';status.wholeDetailError='';
  if(dispose)dispose();
  dispose=FD.author.mountDetails({canvas,toolbar:controls,base:b.design,record:records,getCamera:()=>stageView,
   isActive:()=>status.full42DetailMode==='1'&&currentTab==='stage'&&project.activeStageId==='stage-42-whole-native-blockout',
   report:err,show:w=>{status.wholeDetailCount=String(w.details.length);status.wholeDetailSelected=w.selected??'';
     if(!previewing&&w.pending&&w.pending.points.length>1){invalidateRuntime();renderStage();drawTransientLine(w.pending.points.map(([x,y])=>({x,y})),'#73acb3');}},
   preview:d=>{previewing=true;previewProject=FD.pack.buildFullDetails(HonroMaps,b.design,d).project;invalidateRuntime();renderStage();ok('전체 상세 면 미리보기 완료')},
   save:async d=>{const before=project,next=FD.pack.buildFullDetails(HonroMaps,b.design,d).project,data=await FD.pack.exportFullDetails(HonroMaps,baseRaw(),d);
    if(project!==before)throw Error('재열기 전 상태가 바뀌었습니다');onProject(next);r=data;previewing=false;ok('전체 상세 수동 저장 완료');}
  });
 };
 const btn=(text,fn)=>{
  const q=document.createElement('button');q.type='button';q.textContent=text;q.onclick=async e=>{if(!e.isTrusted)return;try{await fn()}catch(x){err(x.message)}};bar.append(q);
 };
 btn('전체 상세 작도 시작',async()=>{await mount();ok('전체 기준 원본 한정 작도 시작')});
 btn('전체 상세 초안 내보내기',()=>{if(!r)throw Error('먼저 전체 상세를 저장하세요');download('honro-stage42-whole-native-details.json',r,'application/json')});
 const input=document.createElement('input');input.type='file';input.hidden=true;input.accept='.json';
 btn('전체 상세 초안 열기',()=>{status.wholeDetailImport='waiting';input.click()});
 input.onchange=async()=>{
  try{const f=input.files?.[0];if(!f||f.size>28000)throw Error('Wrong full detail draft');const x=await f.text(),v=await FD.pack.reopenFullDetails(HonroMaps,baseRaw(),x);
   onProject(v.project);r=x;await mount(v.details);previewing=false;status.wholeDetailImport='opened';ok('전체 상세 정확 재열기 완료');
  }catch(e){status.wholeDetailImport='error';err(e.message)}finally{input.value=''}
 };
 bar.append(input,controls);
}
