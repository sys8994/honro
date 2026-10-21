()=>{
 const a=HonroApp,e=a.engine,b=e.b,C=HONRO_CORE,log=[],images={},start={heroes:e.heroesAlive().map(u=>({cls:u.cls,hp:u.hp,maxHp:u.maxHp,focus:u.focus,level:u.level,loadout:u.loadout})),enemies:e.alive(1).length};let ticks=0;
 function capture(label,x,y,scale=.55){if(images[label])return;Object.assign(a.scene,{x,y,scale,manual:true,storyTween:null,cinematic:null});a.scene.render(e,0,'',.6,false,0);images[label]=document.querySelector('#battlecanvas').toDataURL('image/png');}
 function step(){if(a.dialogue)HonroStory.finish(a);e.tick(C.STEP);if(!a.dialogue)a.missionTick(C.STEP);ticks++;if(ticks%60===0)a.scene.render(e,1,'',.6,false,1);}
 function aim(u){if(u.cls==='archer'&&b.honroState.ritual?.active&&u.x>2000){const t=e.unit('cliff-cleat');for(const p of [{angle:28,power:.8},...e.shotSeeds(u,C.SKILLS.A01,t)]){const r=e.predict(u,C.SKILLS.A01,p.angle,p.power,t,false);if(r.unit===t.id||r.terrain===t.id)return{id:'A01',p,v:t};}}const id=u.cls==='mage'?'M01':'A01',targets=e.alive(1).filter(v=>!v.honroObjectiveTarget||b.honroState.ritual?.active).sort((v,w)=>(v.honroObjectiveTarget?-1e5:Math.hypot(v.x-u.x,v.y-u.y))-(w.honroObjectiveTarget?-1e5:Math.hypot(w.x-u.x,w.y-u.y)));for(const v of targets){for(const p of e.shotSeeds(u,C.SKILLS[id],v)){const r=e.predict(u,C.SKILLS[id],p.angle,p.power,v,false),hit=e.unit(r.unit);if(hit?.side===1&&(!hit.honroObjectiveTarget||b.honroState.ritual?.active)){const safe=C.shotViable(e,u,C.SKILLS[id],v,p.angle,p.power);if(safe.ok&&safe.risk<1)return{id,p,v:hit};}}}}
 capture('initial',1850,2630,.5);
 for(let n=0;n<350000&&!['won','lost'].includes(b.phase)&&b.round<40;n++){
  const u=e.active;if(e.canAct()&&u?.side===0&&!a.dialogue){
   const ritual=b.honroMarkers.find(m=>m.action==='ritual');if(u.cls==='mage'&&!b.honroState.ritual?.active&&HonroInteractions.eligibility(a,ritual).ok){HonroInteractions.use(a,ritual);log.push({op:'ritual',round:b.round,x:u.x,y:u.y});step();capture('water-open',3920,2350,.6);continue;}
   const goal=u.cls==='mage'?b.honroMapAnchors.receiver.x:b.honroMapAnchors.shotGap.x;
   let shot;if(e.grounded(u)&&(Math.abs(u.x-goal)<30||u.moveLeft<130))shot=aim(u);
   if(shot&&e.fire(shot.id,shot.p.angle,shot.p.power)){log.push({op:'fire',actor:u.id,round:b.round,x:u.x,y:u.y,target:shot.v.id,...shot.p});step();continue;}
   if(u.moveLeft>10&&Math.abs(u.x-goal)>15&&!(u.cls==='mage'&&b.honroState.ritual?.active)){const x=u.x;e.move(Math.sign(goal-u.x),C.STEP);step();if(Math.abs(u.x-x)<.01&&e.grounded(u))e.jump(u);continue;}
   a.defend();
  }step();const t=HonroQuestTargets.records(b).find(t=>t.id==='cliff-cleat');if(t?.broken)capture('target-broken',3920,2350,.6);
 }
 capture('final-shore',1800,2550,.55);return{method:'Production Engine inputs, legal chapter1–4 completion-reward fixture; normal resources and AI, no position/resource resets.',start,end:{phase:b.phase,round:b.round,heroes:e.heroesAlive().map(u=>({id:u.id,hp:u.hp,maxHp:u.maxHp,focus:u.focus,x:u.x,y:u.y})),ritual:b.honroState.ritual,target:HonroQuestTargets.records(b).filter(t=>t.id==='cliff-cleat').map(t=>({hp:t.hp,broken:t.broken})),enemies:e.alive(1).length,flags:b.honroState.flags},ticks,log,images};
}
