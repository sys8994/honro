// Small Workshop source-tool adapter. Host must pass live native transaction
// callbacks; test fixture records must not be routed through this authoring UI.
import {TARGET,SCOPE,pointFromWorkshopPointer,compileEastCap,exportEastCapDraft,attachEastCapDraft} from './east-cap.mjs';
export function mountEastCapWorkshopTool({canvas,toolbar,getProject,getCamera,isActive,preview,commit,onScratch=()=>{},onStatus=()=>{}}){
 if(![getProject,getCamera,isActive,preview,commit].every(fn=>typeof fn==='function'))throw Error('Missing Workshop transaction host');
 const base=structuredClone(getProject());
 if(base.activeStageId!==TARGET.stageId)throw Error('Select Stage42 to author the east cap');
 const state={outline:[],seams:[],bands:['upper','transition','basal'].map(material=>({id:'east-'+material,material}))};
 let mode='top', target=null, serial=0, disposed=false, busy=false;
 const active=()=>!disposed&&isActive()&&getProject().activeStageId===TARGET.stageId;
 const signal=()=>onScratch(structuredClone(state),mode);
 const check=(v,e)=>{if(!v)throw Error(e)};
 const rail=at=>{check(Math.abs(at[0]-SCOPE.seamX)<=5,'원본 동쪽 접합선에 점을 찍으세요');return [SCOPE.seamX,at[1]]};
 const border=at=>{check(at[0]>=SCOPE.cutoffX&&at[0]<=SCOPE.maxX,'승인된 외곽 폭을 벗어났습니다');return [...at]};
 const bounded=at=>{check(at[1]>=SCOPE.topY&&at[1]<=SCOPE.bottomY,'승인된 높이를 벗어났습니다');return at};
 const nearest=(at,targets)=>{
  const r=7/(getCamera().zoom*TARGET.scale);
  return targets.map(v=>({v,d:Math.hypot(v.at[0]-at[0],v.at[1]-at[1])})).filter(q=>q.d<r).sort((a,b)=>a.d-b.d)[0]?.v;
 };
 const push=at=>state.outline.push({id:'cap-v'+(++serial),at});
 function outline(at){if(mode==='top'){push(rail(at));mode='outline';}
  else if(mode==='outline')push(border(at));
  else if(mode==='bottom'){check(state.outline.length>=4,'외곽 점이 부족합니다');push(rail(at));mode='a-start';}}
 function seam(at){
  const i=mode.startsWith('a')?0:1;
  if(mode.endsWith('start')){state.seams[i]={outerId:'',atY:rail(at)[1],knots:[]};mode=(i?'b':'a')+'-knots';}
  else if(mode.endsWith('knots'))state.seams[i].knots.push(border(at));
  else if(mode.endsWith('end')){
   const edge=nearest(at,state.outline.slice(1,-1));check(edge,'동쪽 실루엣 위의 기존 점을 선택하세요');
   state.seams[i].outerId=edge.id;mode=i?'edit':'b-start';
  }
 }
 const allPoints=()=>[
  ...state.outline.map((v,i)=>({at:v.at,snap:!i||i===state.outline.length-1,update:q=>{v.at=q},restore:()=>{}})),
  ...state.seams.flatMap(s=>[{at:[SCOPE.seamX,s.atY],snap:true,update:q=>{s.atY=q[1]}},...s.knots.map((at,i)=>({at,snap:false,update:q=>{s.knots[i]=q}}))])
 ];
 function down(e){
  if(!active()||busy||!e.isTrusted||!e.isPrimary||e.button!==0)return;
  e.stopImmediatePropagation();
  try{
   const at=bounded(pointFromWorkshopPointer(e,canvas,getCamera()));
   if(mode==='edit'){target=nearest(at,allPoints());if(target)canvas.setPointerCapture?.(e.pointerId);}
   else if(['top','outline','bottom'].includes(mode))outline(at);
   else seam(at);
   signal();
  }catch(error){onStatus(error.message);}
 }
 function up(e){
  if(!active()||busy||!target||!e.isTrusted||!e.isPrimary||e.button!==0)return;
  e.stopImmediatePropagation();
  const old=structuredClone(state), hit=target;target=null;
  try{
   const at=bounded(pointFromWorkshopPointer(e,canvas,getCamera()));
   hit.update(hit.snap?rail(at):border(at));
   compileEastCap(state);
   signal();
  }catch(error){Object.assign(state,old);signal();onStatus(error.message);}
 }
 const make=(label,fn)=>{
  const button=document.createElement('button');button.type='button';button.textContent=label;
  button.onclick=async e=>{if(!active()||busy||!e.isTrusted)return;try{await fn();signal();}catch(error){onStatus(error.message);}};
  toolbar.append(button);return button;
 };
 const edit=async save=>{
  check(mode==='edit','외곽과 공유 절리 두 개를 먼저 완성하세요');
  busy=true;
  try{
   const prev=getProject(), raw=await exportEastCapDraft(base,state);
   const next=await attachEastCapDraft(prev,raw);
   check(active()&&getProject()===prev,'검수 중 원본 프로젝트가 변경되었습니다');
   if(save){commit('동쪽 암반 끝마감',prev,next);onStatus('끝마감 초안을 저장했습니다.');}
   else{preview(prev,next);}
  }finally{busy=false;}
 };
 const buttons=[
  make('외곽 끝점',()=>{check(mode==='outline','외곽을 먼저 그리세요');mode='bottom';}),
  make('절리 끝점',()=>{check(mode.endsWith('knots'),'절리점을 먼저 그리세요');mode=mode.replace('knots','end');}),
  make('끝마감 미리보기',()=>edit(false)),make('끝마감 저장',()=>edit(true))
 ];
 const cancel=()=>{target=null;};
 canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',cancel,true);
 return ()=>{disposed=true;canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointerup',up,true);canvas.removeEventListener('pointercancel',cancel,true);buttons.forEach(b=>b.remove());};
}
