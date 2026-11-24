// Stage58 presentation only. Refits approved world positions, never edits Engine.
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
const alive=u=>u&&!u.dead&&u.hp>0;
const obj=u=>({left:u.x-Math.max(u.r,27),right:u.x+Math.max(u.r,27),top:u.y-u.h,bottom:u.y+12});
const marker=m=>({left:m.x-22,right:m.x+22,top:m.y-32,bottom:m.y+12});
export function attachStage58Camera(G,scene,e,roles,four,verify){
 const B=G.HonroBounds,b=e.b,native=scene.render;
 if(!B||!verify()||b.honroAuthoredId!=='stage-58'||b.honroStage!==58)return null;
 let previousScale=null;
 function contents(){
  const f=b.honroState?.flags;
  if(b.phase==='won'&&f?.localFourBodyExit&&f.localDaedosaDefeated&&f['place(correctedInnerStake)']){
   if(four.length!==4||four.some(a=>!b.units.includes(a)||a.side!==0||!alive(a)||!e.grounded(a)))return null;
   return {kind:'returned',all:four.map(obj)};
  }
  if(b.phase!=='aim'||b.side!==0||!f?.localBossManifested||f.localDaedosaDefeated)return null;
  const m=b.honroMarkers?.find(a=>a.id==='local-08-expansion-line-show'&&a.type==='objective'&&a.radius===72);
  const [boss,node]=roles, a=e.active;
  if(!m||!alive(boss)||!alive(node)||!b.units.includes(boss)||!b.units.includes(node)||!four.includes(a)||!alive(a)||
   !e.grounded(a)||!e.grounded(boss)||e.contactSurface(m.x,m.y-8,m.y+8)?.t.id!=='local-lower-08-body')return null;
  return {kind:'warning',all:[obj(a),obj(boss),marker(m)],optional:obj(node)};
 }
 function camera(engine,dt=0,selected='',power=.6,charging=false,effectDt=dt,paused=false){
  const draw=()=>native.call(this,engine,dt,selected,power,charging,effectDt,paused);
  if(this!==scene||engine!==e||e.b!==b||!verify())return draw();
  const now=performance.now(), lease=G.HonroAttackCamera?.status(scene), manual=scene.manual||lease?.manual||lease?.gesture;
  if(manual){previousScale=null;return draw();}
  if(scene.storyFrame||scene.storyTween||scene.storyFrozen||scene.goalFocus||scene.skillPreview||scene.editorView||
   scene.focusUntil>now||scene.speakerUntil>now||G.HonroReinforcementCamera?.active(scene)||charging||(paused&&b.phase!=='won')||b.projectiles?.length||!(dt>0))return draw();
  const data=contents(),w=scene.canvas.clientWidth||scene.canvas.width,h=scene.canvas.clientHeight||scene.canvas.height;
  if(!data){if(previousScale!==null&&b.phase==='aim'){
   scene.scale+=(previousScale-scene.scale)*Math.min(1,dt*5);
   if(Math.abs(previousScale-scene.scale)<.01)previousScale=null;
  }return draw();}
  if(!(w>=300&&h>=330))return draw();
  const marginX=Math.max(25,w*.085),marginY=Math.max(40,h*.115),l=B.zoomLimits(w);
  const box=ps=>({left:Math.min(...ps.map(a=>a.left)),right:Math.max(...ps.map(a=>a.right)),top:Math.min(...ps.map(a=>a.top)),bottom:Math.max(...ps.map(a=>a.bottom))});
  const maxFor=q=>Math.min((w-2*marginX)/(q.right-q.left),(h-2*marginY)/(q.bottom-q.top));
  const core=box(data.all), full=data.optional?box([...data.all,data.optional]):core;
  const intended=data.kind==='returned'?(w<600?.69:.88):(previousScale??scene.scale);
  const body=clamp(intended,l.min,l.max??Infinity);
  const useFull=maxFor(full)>=Math.min(body,maxFor(core))*.88;
  const bounds=useFull?full:core,zoom=Math.min(body,maxFor(bounds));
  if(zoom<l.min-.001)return draw();
  const desired={x:(bounds.left+bounds.right)/2,y:(bounds.top+bounds.bottom)/2-h*.04/zoom,scale:zoom,canvas:scene.canvas};
  B.constrain(desired,b);
  const v=B.viewport(desired,w,h);
  if(v.left>bounds.left||v.right<bounds.right||v.top>bounds.top||v.bottom<bounds.bottom)return draw();
  previousScale??=scene.scale;
  const u=Math.min(dt,.045),alpha=1-Math.exp(-u*7), maxStep=900*u/Math.max(.16,scene.scale);
  for(const k of ['x','y'])scene[k]+=clamp((desired[k]-scene[k])*alpha,-maxStep,maxStep);
  scene.scale+=clamp((zoom-scene.scale)*alpha,-1.8*u,1.8*u);
  B.constrain(scene,b);
  const saved=scene.manual;
  try{scene.manual=true;return draw();}finally{scene.manual=saved;}
 }
 scene.render=camera;
 return ()=>{if(scene.render!==camera)return false;scene.render=native;return true;};
}
