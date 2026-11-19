import {compileDetailShapes,snapDetailPoint,detailRoles,fullDetailOwners} from './detail.mjs';
export function mountDetails({canvas,toolbar,getCamera,isActive,preview,save,report,show,base,record=[]}){
 const details=structuredClone(record);let pending=null,edit=-1,moving=null,busy=false,serial=details.length;
 const controls=[];
 const check=(ok,m)=>{if(!ok)throw Error(m)};
 const add=x=>{controls.push(x);toolbar.append(x);return x};
 const choose=(name,values)=>{const q=add(document.createElement('select'));q.setAttribute('aria-label',name);
  for(const v of values){const x=document.createElement('option');x.value=x.textContent=v;q.append(x)}return q;};
 const owner=choose('Detail owning shape',fullDetailOwners(base));
 const role=choose('Native detail material',detailRoles);
 const known=choose('Existing editable detail',['']);
 const refreshed=()=>{known.replaceChildren();for(const d of details){const o=document.createElement('option');o.value=o.textContent=d.id;known.append(o);}};
 const sync=()=>show({details:structuredClone(details),pending:pending&&structuredClone(pending),selected:edit>=0?details[edit]?.id:null});
 const button=(name,fn)=>{
  const b=add(document.createElement('button'));b.textContent=name;b.onclick=async e=>{
   if(!e.isTrusted||!isActive()||busy)return;
   try{busy=true;await fn();sync()}catch(x){report(x.message)}finally{busy=false}
  };return b;
 };
 const world=e=>{
  const r=canvas.getBoundingClientRect(),v=getCamera();
  return [Math.round(v.x+(e.clientX-r.left-r.width/2)/v.zoom),Math.round(v.y+(e.clientY-r.top-r.height/2)/v.zoom)];
 };
 const p=e=>{const q=world(e),id=(pending??details[edit]).owner;return e.ctrlKey?snapDetailPoint(base,id,q,10/getCamera().zoom):q};
 function down(e){
  if(!e.isTrusted||!isActive()||!e.isPrimary||e.button!==0||busy||(!pending&&edit<0))return;
  e.stopImmediatePropagation?.();
  if(pending){pending.points.push(p(e));sync();return;}
  const q=world(e),nodes=details[edit].points;
  const hit=nodes.map((a,i)=>({i,d:Math.hypot(a[0]-q[0],a[1]-q[1])})).filter(v=>v.d*getCamera().zoom<10).sort((a,b)=>a.d-b.d)[0];
  if(hit){moving=hit.i;canvas.setPointerCapture?.(e.pointerId);}
 }
 function up(e){
  if(moving===null||!isActive()||!e.isTrusted||!e.isPrimary)return;
  e.stopImmediatePropagation?.();
  const old=details[edit].points[moving];details[edit].points[moving]=p(e);
  const i=moving;moving=null;
  try{compileDetailShapes(base,details,{complete:false});sync()}catch(x){details[edit].points[i]=old;report(x.message);sync()}
 }
 const cancel=()=>{moving=null;};
 button('새 구조 면',()=>{check(!pending,'현재 면을 먼저 닫으세요');pending={id:'f-'+(++serial),owner:owner.value,role:role.value,points:[]};edit=-1});
 button('구조 면 닫기',()=>{check(pending,'먼저 새 면을 여세요');compileDetailShapes(base,[...details,pending],{complete:false});details.push(pending);pending=null;refreshed()});
 button('저장된 면 선택',()=>{check(!pending,'편집 전에 신규 면을 닫으세요');edit=details.findIndex(d=>d.id===known.value);check(edit>=0,'선택할 면을 그리세요')});
 button('상세 면 미리보기',async()=>{check(!pending,'미리보기 전에 신규 면을 닫으세요');compileDetailShapes(base,details);await preview(structuredClone(details))});
 button('상세 면 묶음 저장',async()=>{check(!pending,'저장 전에 신규 면을 닫으세요');compileDetailShapes(base,details);await save(structuredClone(details))});
 canvas.addEventListener('pointerdown',down,true);canvas.addEventListener('pointerup',up,true);canvas.addEventListener('pointercancel',cancel,true);
 refreshed();sync();
 return ()=>{canvas.removeEventListener('pointerdown',down,true);canvas.removeEventListener('pointerup',up,true);canvas.removeEventListener('pointercancel',cancel,true);controls.forEach(x=>x.remove())};
}
