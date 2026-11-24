function bindQuiet60(app,s){
 if(app.stageId!==60||!s.engine||!app.scene||!G.document?.head)return;
 const e=s.engine,scene=app.scene,battle=app.root.querySelector('.battle');
 if(!battle?.dataset||typeof app.updateHUD!=='function'||typeof scene.render!=='function')return;
 const style=G.document.createElement('style'),match='.battle[data-act6-quiet="true"]';
 style.textContent=match+' #fire,'+match+' #read-aim,'+match+' .wind-gauge,'+match+' [data-action="combat-skill"],'+match+' [data-action="defend"]{display:none!important}';
 G.document.head.append(style);battle.dataset.act6Quiet='true';
 const notice=G.document.getElementById('notice');
 if(notice?.textContent==='저작 목표를 완료했습니다. 이 검수 결과는 정식 기록에 쓰지 않습니다.'){G.clearTimeout?.(app.noti);notice.hidden=true;}
 const supported=()=>active.get(app)===s&&app.engine===e&&app.scene===scene&&app.stageId===60&&runtime(app);
 const hud=app.updateHUD;
 function update(...args){
  const result=hud.apply(this,args);
  if(this!==app||!supported())return result;
  const objective=battle.querySelector('#objective-text'),turn=battle.querySelector('#turn-text'),move=battle.querySelector('.stick-mode');
  if(objective)objective.textContent=e.b.phase==='won'?'두 혼을 보냈습니다.':'두 혼을 보내고 네 사람이 산문에 모이십시오.';
  if(turn){turn.textContent='이동';turn.dataset.side='walk';}
  if(move)move.textContent='이동';
  return result;
 }
 const render=scene.render;
 function paint(eng,dt,selected,power,charging,...args){
  if(this===scene&&eng===e&&supported()&&e.b.phase!=='won')return render.call(this,eng,dt,'',power,false,...args);
  return render.call(this,eng,dt,selected,power,charging,...args);
 }
 app.updateHUD=update;scene.render=paint;
 s.quiet60=()=>{if(app.updateHUD===update)app.updateHUD=hud;if(scene.render===paint)scene.render=render;style.remove();delete battle.dataset.act6Quiet;};
 app.updateHUD(true);
}
