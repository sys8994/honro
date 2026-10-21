/* Browser-only observer; clock/render scheduling controlled, combat state untouched. */
window.stage5Diagnostic=function(profile,cls,scenario){
 const a=HonroApp,C=HONRO_CORE;a.profile=structuredClone(profile);a.profile.settings.music=false;a.profile.settings.sound=false;a.debugMode=false;
 const reflection=scenario.startsWith('reflection'),training=[];if(reflection){function train(id){if(a.profile.heroes.mage.ranks[id])return;let t=C.TALENT_MAP[id];if(t.prereq)train(t.prereq);let reason=C.trainReason(a.profile.heroes.mage,id);if(reason)throw Error(reason);if(!C.train(a.profile.heroes.mage,id))throw Error('Training rejected');training.push(id);}try{train('M11');}catch(err){return{cls,scenario,blocked:String(err),training};}a.profile.loadouts.mage=['M01','M03','M11'];}a.launch(5);
 let now=performance.now(),frame=0,rows=[],damage=[],fires=[],impacts=[],ends=[];const realNow=performance.now.bind(performance),render=a.scene.render.bind(a.scene);
 Object.defineProperty(performance,'now',{configurable:true,value:()=>now});a.prev=now;a.scene.render=()=>{};
 const e=a.engine,b=e.b,pos=u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,maxMove:u.maxMove,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t.id});
 const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{let hp=u.hp,r=hurt(u,...args);if(hp>u.hp)damage.push({round:b.round,frame,target:u.id,owner:args[1],loss:hp-u.hp});return r;};
 const impact=e.impact.bind(e);e.impact=(p,h)=>{impacts.push({frame,owner:p.owner,skill:p.skill,unit:h.unit?.id,terrain:h.terrain?.id,x:h.x,y:h.y,bounces:p.bounces});return impact(p,h);};
 const fire=e.fire.bind(e);e.fire=(...args)=>{let actor=e.active.id,r=fire(...args);fires.push({frame,round:b.round,actor,args,accepted:r});return r;};
 const finish=e.finishAction.bind(e);e.finishAction=(...args)=>{let u=e.active,r=b.round,acted=u?.acted,v=finish(...args);if(u?.side===1&&!acted&&(u.acted||b.round!==r))ends.push({id:u.id,round:r,intent:u.intent,x:u.x,y:u.y});return v;};
 function tick(){now+=1000/60;a.__frame(now);frame++;if(a.lastError)throw Error(a.lastError);}
 function settle(){for(let n=0;n<20000;n++){if(a.dialogue)HonroStory.finish(a);tick();if(a.canInput()||['won','lost'].includes(b.phase))return;}throw Error('input timeout');}
 function move(x,jumpAt){let u=e.active,from=pos(u),stuck=0,jumped=false;for(let n=0;n<1800&&a.canInput()&&u.moveLeft>2&&Math.abs(u.x-x)>6;n++){if(jumpAt!==undefined&&!jumped&&u.x>=jumpAt&&e.grounded(u)){a.jump();jumped=true;}let old=u.x;a.keys.add(x>u.x?'ArrowRight':'ArrowLeft');tick();a.keys.clear();stuck=Math.abs(u.x-old)<.02?stuck+1:0;if(stuck>30)break;}for(let n=0;n<360&&a.canInput()&&!e.grounded(u);n++)tick();rows.push({op:'move',from,to:pos(u),jumpAt});}
 settle();a.selectHero('p-'+cls);let u=e.active,start=pos(u);if(scenario.endsWith('under'))move(900);if(scenario.endsWith('over'))move(900,690);
 const position=pos(u),id=reflection?'M11':cls==='mage'?'M01':'A01',skill=C.SKILLS[id],predictions=[];
 for(const angle of (reflection?[-40,-20,0,15,30,45,60,75,85]:[0,15,30,45,60,75,85]))for(const power of [.3,.6,1]){const q=e.predict(u,skill,angle,power,undefined,false);predictions.push({angle,power,unit:q.unit,terrain:q.terrain,x:q.x,y:q.y,time:q.time,contacts:q.contacts});}
 let aim=predictions.find(q=>q.angle===30&&q.power===.6);const viable=predictions.filter(q=>e.unit(q.unit)?.side===1);if(viable.length)aim=viable[0];
 if(reflection)aim=predictions.find(q=>q.contacts?.length&&e.unit(q.unit)?.side===1)||predictions.find(q=>q.contacts?.length)||aim;
 if(e.fire(id,aim.angle,aim.power))rows.push({op:'fire',id,aim,position});else rows.push({op:'fire-rejected',id,aim});
 settle();for(let n=0;n<3&&b.round===1&&!['won','lost'].includes(b.phase);n++){if(a.canInput())a.defend();settle();}
 a.scene.render=render;HonroStory.tick(a,now+3000);a.updateHUD();Object.assign(a.scene,{manual:true,x:1000,y:2440,scale:.6,storyTween:null,cinematic:null,goalFocus:null});render(e,0,a.selected,.6,false,0);
 const result={cls,scenario,training,method:'Production App.frame movement/jump, Engine.fire actual projectile, ordinary other-hero defend and R1 enemy AI; controlled clock/render scheduling.',start,position,skill:{id:skill.id,name:skill.name,mode:skill.mode,radius:e.effective(skill,u).radius},predictions,rows,damage,fires,impacts,ends,end:{round:b.round,heroes:e.heroesAlive().map(pos),foes:e.alive(1).length,phase:b.phase},frame};
 Object.defineProperty(performance,'now',{configurable:true,value:realNow});return result;
};
window.stage5Objective=function(profile,battle){
 const a=HonroApp,C=HONRO_CORE;a.profile=structuredClone(profile);a.profile.honroBattle=structuredClone(battle);a.profile.lastStage=5;a.debugMode=false;a.continue();
 const e=a.engine,b=e.b;let now=performance.now(),frame=0,damage=[],log=[];const realNow=performance.now.bind(performance),render=a.scene.render.bind(a.scene);
 Object.defineProperty(performance,'now',{configurable:true,value:()=>now});a.prev=now;a.scene.render=()=>{};
 const pos=u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus,moveLeft:u.moveLeft,support:e.contactSurface(u.x,u.y-5,u.y+5)?.t.id});
 const hurt=e.hurt.bind(e);e.hurt=(u,...args)=>{let old=u.hp,r=hurt(u,...args);if(old>u.hp)damage.push({frame,round:b.round,target:u.id,owner:args[1],loss:old-u.hp});return r;};
 function tick(){now+=1000/60;a.__frame(now);frame++;if(a.lastError)throw Error(a.lastError);}
 function settle(){for(let n=0;n<20000;n++){if(a.dialogue)HonroStory.finish(a);tick();if(a.canInput()||['won','lost'].includes(b.phase))return;}throw Error('input timeout');}
 function move(x){let u=e.active,from=pos(u);for(let n=0;n<1500&&a.canInput()&&u.moveLeft>3&&Math.abs(u.x-x)>6;n++){a.keys.add(x>u.x?'ArrowRight':'ArrowLeft');tick();a.keys.clear();}log.push({op:'move',from,to:pos(u)});}
 const continued={round:b.round,phase:b.phase,heroes:e.heroesAlive().map(pos),foes:e.alive(1).length,ritual:structuredClone(b.honroState.ritual)};settle();a.selectHero('p-archer');move(2375);
 let u=e.active,t=e.unit('cliff-cleat'),hp=t.hp,aim=null;const before={position:pos(u),target:{x:t.x,y:t.y,hp:t.hp},ritual:structuredClone(b.honroState.ritual)};
 for(let angle=0;angle<=84&&!aim;angle+=2)for(const power of [.2,.4,.6,.8,1]){let hit=e.predict(u,C.SKILLS.A01,angle,power,undefined,false);if(hit.unit===t.id||hit.terrain===t.id){aim={angle,power,hit:{x:hit.x,y:hit.y,time:hit.time}};break;}}
 let fired=aim&&e.fire('A01',aim.angle,aim.power);if(fired)settle();const after={round:b.round,targetHp:t.hp,hpLoss:hp-t.hp,ritual:structuredClone(b.honroState.ritual),heroes:e.heroesAlive().map(pos)};
 let mageFire=null;if(a.canInput()&&e.active?.cls==='mage'){move(1500);const holding=structuredClone(b.honroState.ritual),accepted=e.fire('M01',35,.6);mageFire={position:pos(e.active),holding,accepted,ritualAfterFire:structuredClone(b.honroState.ritual)};if(accepted)settle();mageFire.ritualAfterResolution=structuredClone(b.honroState.ritual);}
 a.scene.render=render;HonroStory.tick(a,now+3000);a.updateHUD();Object.assign(a.scene,{manual:true,x:4220,y:2320,scale:.8,storyTween:null,cinematic:null,goalFocus:null});render(e,0,a.selected,.6,false,0);
 Object.defineProperty(performance,'now',{configurable:true,value:realNow});return{scope:'Actual browser Continue of the unchanged native R4 checkpoint, then ordinary movement/fire; not a browser-continuous R1–5 run.',continued,before,aim,fired,after,mageFire,damage,log,frame};
};
