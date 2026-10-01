(function(G){'use strict';
const FINALE_TURNS=6,FINALE_CAP=28;
function finaleSites(b){const a=b.honroMapAnchors||{},site=(id,key,fraction,label)=>{const p=a[key]||{x:b.width*fraction};return{id,label,x:p.x,y:G.HonroWorld.top(b,p.x,p.y,p.support),support:p.support};};return[site('west','westHall',.33,'서쪽 전각'),site('east','eastHall',.71,'동쪽 전각')];}
function ritualPosition(b,sodan){const a=b.honroMapAnchors?.ritual||{x:b.width*.5,y:sodan.spawnY||sodan.y};return G.HonroTerrain.place(b,sodan,{x:a.x,y:G.HonroWorld.top(b,a.x,a.y,a.support),flying:false,maxDistance:160,clearance:12});}
function channeler(b,sodan,position,fraction){const C=G.HONRO_CORE,h=structuredClone(b.heroes.occultist),level=Math.floor(G.HonroProgression.plan(10).entryLevel);h.xp=Math.max(h.xp,C.xpAtLevel(level));C.autoTrain(h,'occultist');sodan.loadout=C.knownSkills(h,'occultist').filter(id=>!C.SKILLS[id].passive).slice(0,4);C.applyHero(sodan,h,true);
 Object.assign(sodan,position,{name:'소단',side:2,spiritSight:true,honroAlly:true,honroCivilian:false,allyRole:'channeler',fixed:true,acted:true,vx:0,vy:0,shield:0,hp:Math.max(1,Math.round(sodan.maxHp*fraction))});delete sodan.moveTarget;delete sodan.aiMove;sodan.airborne=sodan.jumping=false;
 Object.assign(b.honroState,{finaleAnchor:position,finaleRevision:2,finaleSites:finaleSites(b)});
}
function rush(app,index){const e=app.engine,b=e.b,hs=b.honroState,boss=e.unit('boss'),space=Math.max(0,FINALE_CAP-e.alive(1).length),n=Math.min(index===0?8:6,space);if(!n)return index>0;
 const before=new Set(b.units.map(u=>u.id)),sites=hs.finaleSites||finaleSites(b),front=sites[index%2===0?1:0],rear=sites[index%2===0?0:1];
 const actions=[{type:'spawn',n:Math.ceil(n*.5),kind:index%3===2?'boar':'hound',site:front},{type:'spawn',n:Math.floor(n*.5),kind:'crow',site:rear}].filter(a=>a.n).map(a=>({...a,x:a.site.x,y:a.site.y,support:a.site.support,spacing:140,maxDistance:288,source:a.site.id}));
 if(G.HonroAllies.execute(app,{type:'multi',actions})===false)return false;
 const units=b.units.filter(u=>!before.has(u.id));for(let i=0;i<units.length;i++){const u=units[i];u.aggroUntil=b.round+10;if(i%2===0){u.honroTargetId=boss.id;u.honroTargetUntil=b.round+10;}}
 hs.finaleSites=sites;hs.finaleWaves??=[];hs.finaleWaves.push({index,round:b.round,units:units.map(u=>u.id),sources:actions.map(a=>a.source)});for(const site of sites)e.fx('ring',site.x,site.y-45,'#b85e5b',90);app.event(`${front.label}에서 짐승, ${rear.label}에서 까마귀가 몰려온다 · ${index+1}차 습격`);return true;}
function finale(app){const e=app.engine,b=e.b,hs=b.honroState,sodan=e.unit('boss');if(!sodan||sodan.dead)return;
 if(!hs.sodanCoop){if(!app.actorBoundary||(hs.receivers||0)<2||sodan.hp>sodan.maxHp*.42)return;
  const position=ritualPosition(b,sodan);if(!position)return;
  if(!rush(app,0))return;
  hs.sodanBreach={units:hs.finaleWaves[0].units,round:b.round,source:'east'};hs.sodanCoop=true;hs.coopHold=0;hs.finaleLastEnemyEnd=b.teamEnds[1]+(b.side===1?1:0);hs.finaleWave=0;
  channeler(b,sodan,position,.8);e.fx('ring',sodan.x,sodan.y-12,'#deb56e',80);
  b.queue=(b.queue||[]).filter(id=>id!==sodan.id);
  const beforeCoop=l=>l[2]?.storyId?.includes('entry-follow-10-');hs.deferredStory=(hs.deferredStory||[]).filter(q=>!q.lines.some(beforeCoop));hs.storyQueue=(hs.storyQueue||[]).filter(l=>!beforeCoop(l));
  app.sayLines(G.HonroStoryContent.cooperation());
 }
 // Old saves retain earned progress, but need six full enemy turns in total.
 if(hs.finaleRevision!==2){const position=ritualPosition(b,sodan);if(position)channeler(b,sodan,position,Math.min(1,sodan.hp/sodan.maxHp));}
 hs.finaleLastEnemyEnd??=b.teamEnds[1];hs.finaleWave??=hs.coopHold||0;hs.finaleDefenseTurns??=hs.coopHold||0;hs.finaleAnchor??={x:sodan.x,y:sodan.y};
 Object.assign(sodan,{...hs.finaleAnchor,side:2,honroAlly:true,allyRole:'channeler',fixed:true,vx:0,vy:0});delete sodan.moveTarget;delete sodan.aiMove;b.enemyLimit=b.honroActiveLimit=6;
 if(!app.actorBoundary)return;
 if(b.teamEnds[1]>hs.finaleLastEnemyEnd){const delta=b.teamEnds[1]-hs.finaleLastEnemyEnd,previous=hs.coopHold||0;hs.finaleLastEnemyEnd=b.teamEnds[1];hs.finaleDefenseTurns+=delta;hs.coopHold=Math.min(FINALE_TURNS,hs.finaleDefenseTurns);if(previous<3&&hs.coopHold>=3)app.sayLines(G.HonroStoryContent.finaleMidpoint());}
 // An unusually early conversion must not leave empty rounds until the campaign pacing floor.
 if(!G.HonroObjectives.state(b,app.stage).complete&&hs.finaleWave<hs.finaleDefenseTurns&&rush(app,hs.finaleDefenseTurns))hs.finaleWave=hs.finaleDefenseTurns;
}
function reinforceHold(app,boundary){
 const e=app.engine,b=e.b,hs=b.honroState,st=app.stage;
 if(!boundary||b.side!==0||st.id===10||hs.lastHabitatRound===b.round)return;
 const objective=G.HonroObjectives.state(b,st);
 const holding=st.objective==='defend'||objective.objectiveReady&&!objective.complete&&objective.settleRounds>0;
 if(!holding||objective.complete)return;
 hs.lastHabitatRound=b.round;
 const foes=e.alive(1).length,minimum=st.objective==='defend'?7:5;
 if(foes>=minimum||b.units.length>=68)return;
 const sites=(b.honroMarkers||[]).filter(m=>m.type==='hauntHabitat');if(!sites.length)return;
 // Alternate habitats and keep emergence away from the party's feet.
 const heroes=e.heroesAlive(),ranked=sites.map(site=>({site,distance:Math.min(...heroes.map(u=>Math.hypot(u.x-site.x,(u.y-site.y)*.6)))})).sort((a,c)=>c.distance-a.distance);
 const distant=ranked.filter(item=>item.distance>=400),contested=!distant.length,choices=contested?ranked:distant;
 const ordered=choices.length>1?[choices[b.round%choices.length],...choices.filter((_,i)=>i!==b.round%choices.length)]:choices;
 const n=Math.min(contested?2:4,minimum-foes,68-b.units.length);
 for(const item of ordered){const site=item.site;
  for(let count=n;count>=1;count--){
   const spawned=G.HonroAllies.execute(app,{type:'spawn',n:count,kind:site.kind,x:site.x,y:site.y,support:site.support,spacing:contested?240:110,maxDistance:260,clearance:contested?100:18,source:site.id});
   if(spawned===false)continue;
   e.fx('ring',site.x,site.y-28,'#a46f73',56);app.event(`${site.label}에서 들린 짐승이 나타났다.`);return;
  }
 }
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
 // Once started, only leaving the array (or losing the holder) releases it.
 // grounded() includes velocity: a small hit used to cancel it before any movement.
 if(st.id===5){const ritual=hs.ritual,veil=b.terrain.find(t=>t.id==='waterfall-veil'),cleat=b.terrain.find(t=>t.id==='cliff-cleat'),marker=b.honroMarkers.find(m=>m.id==='receiver-5'),holder=ritual?.holderId?e.unit(ritual.holderId):null;const valid=!!ritual?.active&&!!holder&&!holder.dead&&holder.hp>0&&holder.cls==='mage'&&!!marker&&Math.abs(holder.x-marker.x)<=125&&Math.abs(holder.y-marker.y)<=80;if(cleat?.broken){if(ritual)ritual.active=false;hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}if(marker)marker.collected=true;}else if(valid){hs.waterfallSight=true;if(veil&&!veil.broken){veil.broken=true;b.sceneVersion++;}}else{if(ritual?.active){ritual.active=false;app.event('담허가 받이진에서 벗어나 물틈이 다시 닫혔다.');}hs.waterfallSight=false;if(veil?.broken){veil.broken=false;b.sceneVersion++;}}}
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
 reinforceHold(app,boundary);
 if(st.objective==='overwatch'&&obj&&!obj.dead&&!e.alive(1).length&&!G.HonroEncounters.pending(b)&&!b.projectiles.length){obj.x=Math.min(b.honroEscortGoalX,obj.x+dt*180);obj.y=G.HonroWorld.top(b,obj.x,obj.y);}
 if(st.id===10)finale(app);
 app.checkMission(e);
}
G.HonroMission={tick,finale,finaleSites,FINALE_TURNS,FINALE_CAP};
})(globalThis);
