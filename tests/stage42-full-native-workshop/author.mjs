import {emptyDesign,compileFullShape,ZONES,JOINS} from './model.mjs';
// Exact empty authoring state; all points come from true canvas. Reopen only
// from previously verified native compact record. No point-write/import API.
export function mountFullAuthor({canvas,controls,getCamera,isActive,read,preview,save,report,record=null}){
 let d=record?structuredClone(record):emptyDesign(),mode=record?'edit':'write',phase=0,drag=null,busy=false;
 if(!record){
  d.joins=JOINS.map(()=>({top:null,bottom:null}));
  d.bearings=Array.from({length:3},()=>({head:[],toe:[],sides:[[],[]]}));d.back=[[],[]];
  d.margins=[['left','west'],['bottom','center'],['top','back-0'],['right','gate']].map(([side,owner])=>({side,owner,points:[]}));
 }
 const parts=[
  ...d.joins.flatMap((j,i)=>['top','bottom'].map(k=>({label:'join-'+i+'-'+k,kind:'join',k,i,j}))),
  ...d.sections.flatMap(r=>['top','bottom'].map(k=>({label:r.zone+'-'+k,p:r[k],min:2}))),
  ...['top','bottom'].map(k=>({label:'deck-'+k,p:d.upper[k],min:2})),
  ...d.bearings.flatMap((r,i)=>[{label:'bearing-'+i+'-head',p:r.head,min:2,max:2},{label:'bearing-'+i+'-side1',p:r.sides[0],min:0,max:4},{label:'bearing-'+i+'-toe',p:r.toe,min:2,max:2},{label:'bearing-'+i+'-side2',p:r.sides[1],min:0,max:4}]),
  ...d.back.map((p,i)=>({label:'back-'+i,p,min:4})),
  ...d.margins.map(m=>({label:'margin-'+m.side,p:m.points,min:4,margin:m}))
 ];
 const remove=[];
 const emit=()=>read({phase:mode==='edit'?'edit':parts[phase].label,design:structuredClone(d)});
 const need=(v,m)=>{if(!v)throw Error(m)};
 const points=()=>parts.flatMap(p=>p.kind==='join'?(p.j[p.k]?[{pt:p.j[p.k],part:p}]:[]):p.p.map(x=>({pt:x,part:p})));
 const world=e=>{const c=canvas.getBoundingClientRect(),v=getCamera();return [Math.round(v.x+(e.clientX-c.left-c.width/2)/v.zoom),Math.round(v.y+(e.clientY-c.top-c.height/2)/v.zoom)]};
 const near=(q,arr)=>arr.map(z=>({...z,dist:Math.hypot(q[0]-z.pt[0],q[1]-z.pt[1])})).filter(z=>z.dist*getCamera().zoom<11).sort((a,b)=>a.dist-b.dist)[0];
 const allowed=e=>e.isTrusted&&isActive()&&!busy;
 const push=e=>{
  if(!allowed(e)||e.button!==0||!e.isPrimary)return;e.stopImmediatePropagation();const q=world(e);
  try{
   if(mode==='edit'){
    drag=near(q,points().filter(a=>!a.part.margin));
    if(drag)canvas.setPointerCapture?.(e.pointerId);return;
   }
   const a=parts[phase];
   if(a.kind==='join'){
    if(a.k==='bottom'){need(a.j.top,'Draw join top first');need(Math.abs(q[0]-a.j.top[0])*getCamera().zoom<11,'Click below chosen native join');q[0]=a.j.top[0];}
    a.j[a.k]=q;
   }else{
    need(a.p.length<(a.max??24),'Current role has enough editable nodes');
    if(a.margin&&e.ctrlKey){const owner=points().filter(z=>(z.part.label===a.margin.owner||z.part.label.startsWith(a.margin.owner+'-'))||z.part.kind==='join');
     const linked=near(q,owner);need(linked,'Ctrl-click existing new owned parent endpoint');a.p.push([...linked.pt]);}
    else a.p.push(q);
   }emit();
  }catch(x){report(x.message)}
 };
 const receive=e=>{
  if(!drag||!allowed(e)||!e.isPrimary)return;e.stopImmediatePropagation();
  const q=world(e),old=[...drag.pt],changed=[];
  if(drag.part.kind==='join')q[0]=old[0]; // preserve single join column.
  const r=drag.pt;drag=null;
  for(const v of [r,...d.margins.flatMap(m=>m.points).filter(p=>p[0]===old[0]&&p[1]===old[1])]){
   changed.push([v,[...v]]);v.splice(0,2,...q);
  }
  try{compileFullShape(d);emit()}catch(e){for(const [v,a] of changed)v.splice(0,2,...a);report(e.message);}
 };
 const btn=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=async e=>{if(!allowed(e))return;busy=true;try{await fn()}catch(e){report(e.message)}finally{busy=false}};controls.append(b);remove.push(b)};
 btn('전체 작도 다음 단계',()=>{
  need(mode==='write','이미 편집 단계');
  const p=parts[phase];need(p.kind==='join'?p.j[p.k]:p.p.length>=p.min,'현재 역할의 점을 직접 찍으세요');
  if(phase===parts.length-1){compileFullShape(d);mode='edit'}else phase++;
  emit();
 });
 btn('전체 지형 미리보기',()=>{need(mode==='edit','전체 구역과 외곽을 완성하세요');compileFullShape(d);preview(structuredClone(d))});
 btn('전체 지형 초안 저장',()=>{need(mode==='edit','전체 구역과 외곽을 완성하세요');compileFullShape(d);save(structuredClone(d))});
 const c=()=>{drag=null;};canvas.addEventListener('pointerdown',push,true);canvas.addEventListener('pointerup',receive,true);canvas.addEventListener('pointercancel',c,true);
 emit();
 return ()=>{canvas.removeEventListener('pointerdown',push,true);canvas.removeEventListener('pointerup',receive,true);canvas.removeEventListener('pointercancel',c,true);remove.forEach(b=>b.remove())};
}
