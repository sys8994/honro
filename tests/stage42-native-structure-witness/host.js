// Disposable V4, independent representative section restart; no V3 write.
function installStructureWitness(){
 const bar=document.createElement('div'),canvas=document.querySelector('#stageCanvas'),status=document.documentElement.dataset;
 if(!canvas||document.querySelector('#nativeV4Host'))return;
 bar.id='nativeV4Host';Object.assign(bar.style,{position:'fixed',right:'12px',bottom:'7px',zIndex:210,background:'#182024',padding:'4px'});
 let previewOnly=null,raw=null,unmount=null,ready=false;
 const button=(label,cb)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cb)b.onclick=async e=>{if(!e.isTrusted)return;try{await cb()}catch(x){status.v4Error=x.message;toast(x.message)}};bar.append(b);return b};
 const step=button('다음 작도 단계'),preview=button('구조 미리보기'),save=button('구조 초안 저장');
 const userStatus=t=>{status.v4Status=t;toast(t)};
 const set=p=>{project=p;previewProject=previewOnly=null;history=[];future=[];selected=null;selectedAssetId=p.library[0]?.id;stageView._fit=false;switchTab('stage')};
 const blank=()=>{
  const id='stage-42-structure-witness',s=HonroMaps.emptyStage(id,'5막 2장 구조 작도 시험',6500,2861);
  Object.assign(s,{id,terrains:[],elements:[],units:[],events:[],markers:[],metadata:{sandbox:true,authoringMode:'blank-native-structure'}});
  const p=HonroMaps.normalize({stages:[s],library:[],activeStageId:id});p.library=[];return p;
 };
 button('빈 구조 작도 작업본',()=>{
  if(unmount)unmount();status.cleanNeutral='1';set(blank());raw=null;ready=true;status.v4Error='';
  unmount=mountStructure({canvas,nextButton:step,previewButton:preview,saveButton:save,getCamera:()=>stageView,isActive:()=>ready&&currentTab==='stage'&&project.activeStageId==='stage-42-structure-witness',
   preview:(d)=>{previewOnly=buildWorkshopStructure(HonroMaps,d).project;previewProject=previewOnly;invalidateRuntime();renderStage();userStatus('구조 미리보기 완료')},
   commit:(d)=>{const next=buildWorkshopStructure(HonroMaps,d).project;const data=exportStructure(d);set(next);raw=data;userStatus('구조 초안 저장 완료')},
   onError:x=>{status.v4Error=x;toast(x)},
   onState:({phase,clicks,design})=>{status.v4Phase=phase;status.v4Clicks=String(clicks);invalidateRuntime();renderStage();
    const lines=[design.background,design.road.top,design.road.underside,design.deck.top,design.deck.underside,...design.supports.flatMap(s=>[s.head,s.toe,...s.sides])];for(const pts of lines)if(pts.length>1)drawTransientLine(pts.map(([x,y])=>({x,y})),'#7ab2bc');
   }});
  userStatus('구조 시작: 자산 0개');
 });
 button('구조 초안 내보내기',()=>{if(!raw)throw Error('먼저 구조 초안을 저장하세요');download('honro-stage42-structure-witness.json',raw,'application/json')});
 const file=document.createElement('input');file.type='file';file.hidden=true;file.accept='.json';
 button('구조 초안 열기',()=>{status.v4Import='waiting';file.click()});
 file.onchange=async()=>{try{const f=file.files?.[0];if(!f||f.size>13000)throw Error('지원하지 않는 초안');const s=await f.text(),p=reopenStructure(HonroMaps,s).project;status.cleanNeutral='1';set(p);raw=s;status.v4Import='opened';userStatus('구조 초안 재열기 완료')}catch(e){status.v4Import='error';status.v4Error=e.message;toast(e.message)}finally{file.value=''}};
 bar.append(file);document.body.append(bar);
}
setTimeout(installStructureWitness,0);
