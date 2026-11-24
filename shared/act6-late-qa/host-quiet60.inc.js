function bindQuiet60(app,s){
 const e=s.engine,scene=app.scene,root=app.root;
 if(app.stageId!==60||!e||!scene||!root?.querySelector||typeof app.updateHUD!=='function'||typeof scene.render!=='function')return;
 const fire=root.querySelector('#fire');
 if(!fire?.style)return;
 const supported=()=>active.get(app)===s&&app.engine===e&&app.scene===scene&&app.stageId===60&&runtime(app);
 if(!supported())return;
 const notices=G.document?.getElementById('notice');
 if(notices?.textContent==='저작 목표를 완료했습니다. 이 검수 결과는 정식 기록에 쓰지 않습니다.'){G.clearTimeout?.(app.noti);notices.hidden=true;}
 const controls=['#fire','#combat-skills','#read-aim','.wind-gauge','[data-action="combat-skill"]','[data-action="defend"]'];
 const memory=new Map();
 function hideCombat(){
  for(const selector of controls)for(const el of root.querySelectorAll(selector)){
   if(!el.style)continue;
   if(!memory.has(el))memory.set(el,{display:el.style.getPropertyValue('display'),priority:el.style.getPropertyPriority('display'),inert:el.hasAttribute('inert')});
   el.style.setProperty('display','none','important');
   el.setAttribute('inert','');
  }
 }
 const hud=app.updateHUD;
 function update(...args){
  const result=hud.apply(this,args);
  if(this!==app||!supported())return result;
  hideCombat();
  const objective=root.querySelector('#objective-text'),turn=root.querySelector('#turn-text'),move=root.querySelector('.stick-mode');
  if(objective)objective.textContent=e.b.phase==='won'?'두 혼을 보냈습니다.':'두 혼을 보내고 네 사람이 산문에 모이십시오.';
  if(turn){turn.textContent='이동';if(turn.dataset)turn.dataset.side='walk';}
  if(move)move.textContent='이동';
  return result;
 }
 const render=scene.render;
 function paint(eng,dt,selected,power,charging,...args){
  if(this===scene&&eng===e&&supported()&&e.b.phase!=='won')return render.call(this,eng,dt,'',power,false,...args);
  return render.call(this,eng,dt,selected,power,charging,...args);
 }
 app.updateHUD=update;scene.render=paint;
 s.quiet60=()=>{
  if(app.updateHUD===update)app.updateHUD=hud;
  if(scene.render===paint)scene.render=render;
  for(const [el,old] of memory){
   if(el.style.getPropertyValue('display')==='none'&&el.style.getPropertyPriority('display')==='important'){
    if(old.display)el.style.setProperty('display',old.display,old.priority);
    else el.style.removeProperty('display');
   }
   if(!old.inert)el.removeAttribute('inert');
  }
  memory.clear();
 };
 app.updateHUD(true);
}
