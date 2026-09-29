(function(G){'use strict';
const FINALE_TURNS=6,FINALE_CAP=28;
function rush(app,index){const e=app.engine,b=e.b,hs=b.honroState,boss=e.unit('boss'),space=Math.max(0,FINALE_CAP-e.alive(1).length),n=Math.min(index===0?8:6,space);if(!n)return index>0;
 const before=new Set(b.units.map(u=>u.id)),dir=index%2?-1:1,x=Math.max(180,Math.min(b.width-200,boss.x+dir*(650+index*35)));
 const actions=[{type:'spawn',n:Math.ceil(n*.65),x,kind:index%3===2?'boar':'hound'},{type:'spawn',n:Math.floor(n*.35),x:Math.max(180,Math.min(b.width-200,boss.x-dir*720)),kind:'crow'}].filter(a=>a.n);
 if(G.HonroAllies.execute(app,{type:'multi',actions})===false)return false;
 const units=b.units.filter(u=>!before.has(u.id));for(let i=0;i<units.length;i++){const u=units[i];u.aggroUntil=b.round+10;if(i%2===0){u.honroTargetId=boss.id;u.honroTargetUntil=b.round+10;}}
 hs.finaleWaves??=[];hs.finaleWaves.push({index,round:b.round,units:units.map(u=>u.id)});app.event(`혼매듭으로 몰려드는 들림 · ${index+1}차 습격`);return true;}
function finale(app){const e=app.engine,b=e.b,hs=b.honroState,sodan=e.unit('boss');if(!sodan||sodan.dead)return;
 if(!hs.sodanCoop){if(!app.actorBoundary||(hs.receivers||0)<2||sodan.hp>sodan.maxHp*.42)return;
  if(!rush(app,0))return;
  hs.sodanBreach={units:hs.finaleWaves[0].units,round:b.round,source:'east'};hs.sodanCoop=true;hs.coopHold=0;hs.finaleLastEnemyEnd=b.teamEnds[1]+(b.side===1?1:0);hs.finaleWave=0;
  Object.assign(sodan,{side:2,honroAlly:true,honroCivilian:false,allyRole:'channeler',fixed:true,acted:true,vx:0,vy:0,shield:Math.max(sodan.shield||0,100),hp:Math.max(sodan.hp,Math.round(sodan.maxHp*.65))});hs.finaleAnchor={x:sodan.x,y:sodan.y};
  const C=G.HONRO_CORE,h=structuredClone(b.heroes.occultist);h.xp=Math.max(h.xp,C.xpAtLevel(sodan.level||1));C.autoTrain(h,'occultist');sodan.ranks={...h.ranks};sodan.loadout=C.knownSkills(h,'occultist').filter(id=>!C.SKILLS[id].passive).slice(0,4);Object.assign(sodan,C.criticalStats('occultist',sodan.level,sodan.ranks));
  b.queue=(b.queue||[]).filter(id=>id!==sodan.id);
  const beforeCoop=l=>l[2]?.storyId?.includes('entry-follow-10-');hs.deferredStory=(hs.deferredStory||[]).filter(q=>!q.lines.some(beforeCoop));hs.storyQueue=(hs.storyQueue||[]).filter(l=>!beforeCoop(l));
  app.sayLines(G.HonroStoryContent.cooperation());
 }
 // Old saves retain earned progress, but need six full enemy turns in total.
 hs.finaleLastEnemyEnd??=b.teamEnds[1];hs.finaleWave??=hs.coopHold||0;hs.finaleDefenseTurns??=hs.coopHold||0;hs.finaleAnchor??={x:sodan.x,y:sodan.y};
 Object.assign(sodan,{...hs.finaleAnchor,side:2,honroAlly:true,allyRole:'channeler',fixed:true,vx:0,vy:0});delete sodan.moveTarget;delete sodan.aiMove;b.enemyLimit=b.honroActiveLimit=6;
 if(!app.actorBoundary)return;
 if(b.teamEnds[1]>hs.finaleLastEnemyEnd){const delta=b.teamEnds[1]-hs.finaleLastEnemyEnd,previous=hs.coopHold||0;hs.finaleLastEnemyEnd=b.teamEnds[1];hs.finaleDefenseTurns+=delta;hs.coopHold=Math.min(FINALE_TURNS,hs.finaleDefenseTurns);if(previous<3&&hs.coopHold>=3)app.sayLines(G.HonroStoryContent.finaleMidpoint());}
 // An unusually early conversion must not leave empty rounds until the campaign pacing floor.
 if(!G.HonroObjectives.state(b,app.stage).complete&&hs.finaleWave<hs.finaleDefenseTurns&&rush(app,hs.finaleDefenseTurns))hs.finaleWave=hs.finaleDefenseTurns;
}
function tick(app,dt){
 const e=app.engine;if(!e||app.training)return;
 if(e.b.honroCustom){G.HonroAuthored.tick(app,dt);return;}
 const b=e.b,st=app.stage,hs=b.honroState,heroes=e.heroesAlive();if(!hs||!heroes.length||['won','lost'].includes(b.phase))return;
 if(st.id===7&&(hs.rescuedCount||0)>=3){const instruction=l=>l[2]?.storyId?.includes('entry-follow-7-');hs.deferredStory=(hs.deferredStory||[]).filter(q=>!q.lines.some(instruction));hs.storyQueue=(hs.storyQueue||[]).filter(l=>!instruction(l));}
 const lead=heroes.reduce((a,c)=>a.x>c.x?a:c),height=Math.min(...heroes.map(h=>h.y)),boundary=b.phase==='transition'&&!b.projectiles.length&&!e.settleBusy();
 for(const m of b.honroMarkers||[]){
   const distance=m.type==='sector'?430:m.type==='relic'?155:180;
   if(heroes.some(u=>Math.hypot(u.x-m.x,(u.y-m.y)*(m.type==='sector'?.6:1))<distance))m.honroPending=true;
   if(!m.honroPending)continue;
   if(m.type==='sector'&&!hs.flags['sector-'+m.sector]){hs.flags['sector-'+m.sector]=true;app.event(m.label);}
   if(m.type==='rest'&&!m.collected&&!e.alive(1).some(v=>Math.abs(v.x-m.x)<470&&!v.fixed)){
     m.collected=true;for(const u of G.HonroAllies.coalition(e)){u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.30));if(!u.honroCivilian)u.focus=Math.min(u.maxFocus,u.focus+Math.round(u.maxFocus*.40));e.fx('ring',u.x,u.y-u.h*.5,'#a9b892',40);}e.emit('sound',{name:'heal'});app.event('불씨를 지켰다. 동행이 숨을 고른다.');
   }
   if(m.type==='relic'&&!m.collected){m.collected=true;app.event('길에 남은 기록을 주웠다.');}
 }
 // Stage 5: Damheo's position is the gate. Leaving the receiving array closes the actual projectile blocker.
 if(st.id===5){const ritual=hs.ritual,veil=b.terrain.find(t=>t.id==='waterfall-veil'),cleat=b.terrain.find(t=>t.id==='cliff-cleat'),marker=b.honroMarkers.find(m=>m.id==='receiver-5'),holder=ritual?.holderId?e.unit(ritual.holderId):null;const valid=!!ritual?.active&&!!holder&&!holder.dead&&holder.hp>0&&holder.cls==='mage'&&!!marker&&Math.abs(holder.x-marker.x)<=125&&Math.abs(holder.y-marker.y)<=80&&e.grounded(holder);if(cleat?.broken){if(ritual)ritual.active=false;hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}if(marker)marker.collected=true;}else if(valid){hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}}else{if(ritual?.active){ritual.active=false;app.event('담허가 받이진에서 벗어나 물틈이 다시 닫혔다.');}hs.waterfallSight=false;if(veil?.broken){veil.broken=false;b.sceneVersion++;}}}
 const obj=e.unit('objective');
 if(st.objective==='rescue'&&obj&&!obj.dead){
   if(!hs.rescued&&heroes.some(u=>Math.hypot(u.x-obj.x,u.y-obj.y)<205))hs.rescuePending=true;
   if(hs.rescuePending&&!hs.rescued){hs.rescued=true;app.event('뒤처진 피란민이 일행을 따라오기 시작한다.');}
   if(hs.rescued&&lead.x>obj.x+65&&b.phase!=='ally'){obj.x+=Math.min(dt*360,lead.x-obj.x-60);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}
 }
 if(boundary&&b.side===0&&hs.lastRitualRound!==b.round){
   hs.lastRitualRound=b.round;hs.lastRound=b.round;
   if(st.objective==='ritual'){const k=heroes.find(u=>u.cls==='knight'),altar=b.honroMarkers.find(m=>m.type==='shrine');if(k&&altar&&!b.terrain.some(t=>t.honroSeal&&!t.broken)&&Math.hypot(k.x-altar.x,k.y-altar.y)<330){hs.hold++;app.event(hs.hold>=st.holdRounds?'왕문이 열렸다.':'왕문 의식 · '+hs.hold+'/'+st.holdRounds);}}
 }
 const progress=st.objective==='overwatch'?(obj?.x||0):st.objective==='escort'?Math.max(lead.x,obj?.x||0):lead.x;
 G.HonroEncounters.update(app,dt,{progress,height,broken:b.terrain.filter(t=>t.honroSeal&&t.broken).length,collected:b.honroMarkers.filter(m=>m.type==='relic'&&m.collected).length});
 if(st.objective==='overwatch'&&obj&&!obj.dead&&!e.alive(1).length&&!G.HonroEncounters.pending(b)&&!b.projectiles.length){obj.x=Math.min(b.honroEscortGoalX,obj.x+dt*180);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}
 if(st.id===10)finale(app);
 app.checkMission(e);
}
G.HonroMission={tick,finale,FINALE_TURNS,FINALE_CAP};
})(globalThis);
