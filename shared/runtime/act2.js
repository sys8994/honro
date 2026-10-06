(function(G){'use strict';
const C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const active=b=>b?.honroStage>=11&&b.honroStage<=20&&!b.honroCustom;
const skill=(id,name,cls,mode,damage,radius,gravity,extra={})=>({id,name,cls,mode,damage,radius,gravity,cost:0,enemyOnly:true,speed:.82,wind:.15,terrain:.35,color:'#b5bcb3',icon:'resonance',tag:'묵종의 들림',desc:name+' · 동굴의 낮은 사선을 노리는 공격',existenceAttack:C.attackForSkill({id,cls}),...extra});
Object.assign(C.SKILLS,{
 H2CART:skill('H2CART','철륜 파편','knight','honroWoodSpike',29,45,.25,{terrain:1.1}),
 H2PICK:skill('H2PICK','쪼개는 날','archer','honroEchoNeedle',24,22,.16,{terrain:1.3}),
 H2WATER:skill('H2WATER','역류 물살','mage','honroWardGust',25,78,.12),
 H2STONE:skill('H2STONE','법등의 재','occultist','honroSoulFlame',22,66,.14),
 H2RESONANCE:skill('H2RESONANCE','빈 종의 울림','occultist','honroDeadBreath',24,58,.15),
 H2ECHO:skill('H2ECHO','되돌아온 소리','occultist','honroEchoNeedle',18,28,.10),
 H2HOIST:skill('H2HOIST','인양추','knight','honroBierWeight',34,62,.75,{terrain:1.2}),
 H2KEEPER:skill('H2KEEPER','묵종 공명','occultist','honroMournerWail',32,92,.18)
});
const enemy=(name,look,cls,skills,extra={})=>({act2:true,name,look,cls,skills,role:cls==='knight'?'leaper':cls==='archer'?'bow':'fire',h:96,r:26,intent:name, ...extra});
Object.assign(G.HonroWorld.archetypes,{
 minecart:enemy('들린 운반수레','minecart','knight',['H2CART'],{h:84,r:43,mobile:true}),
 picks:enemy('곡괭이 군집','picks','archer',['H2PICK'],{h:80,r:29}),
 waterwheel:enemy('들린 수차','waterwheel','mage',['H2WATER'],{h:155,r:52,stationary:true}),
 stoneLantern:enemy('석등귀','stoneLantern','occultist',['H2STONE'],{h:138,r:30,stationary:true}),
 resonance:enemy('공명혼','resonance','occultist',['H2RESONANCE'],{h:105,r:26,flying:true,spirit:true}),
 echo:enemy('잔향혼','echo','occultist',['H2ECHO'],{h:86,r:22,flying:true,spirit:true,echo:true}),
 bellCluster:enemy('종울림 군집','bellCluster','occultist',['H2RESONANCE','H2ECHO'],{h:128,r:37,flying:true,spirit:true}),
 hoist:enemy('들린 인양틀','hoist','knight',['H2HOIST'],{h:205,r:60,stationary:true}),
 keeper:enemy('종지기','keeper','occultist',['H2KEEPER','H2RESONANCE'],{h:103,r:25,keeper:true}),
 monkVessel:enemy('승려에게 붙은 혼','resonance','occultist',['H2ECHO'],{h:92,r:23,flying:true,spirit:true})
});
function configureEnemy(u,d){
 u.honroAct2=true;
 if(d.stationary)u.fixed=true;
 if(d.mobile){u.walkSpeed=350;u.maxMove=u.moveLeft=750;}
 if(d.spirit){u.spiritHidden=true;u.honroSpirit=true;u.existenceDefense={form:.06,qi:.40,soul:1.32};}
 else u.existenceDefense={form:1,qi:.95,soul:.82};
 if(d.echo)u.honroEcho=true;
 if(d.look==='hoist'||d.keeper){const mult=d.keeper?4.2:2.4;u.hp=u.maxHp=Math.round(u.maxHp*mult);u.combatBaseHp*=mult;u.elite=true;u.honroXpWeight=d.keeper?5:3;}
 if(d.keeper){u.honroNonlethal=true;u.honroAct2Boss=true;}
}
function recruit(profile){
 if(!profile.cleared?.[10]||profile.recruited.includes('occultist'))return;
 const level=Math.max(1,...['archer','mage','knight'].map(c=>C.levelOf(profile.heroes[c])));
 G.HonroProgression.recruit(profile,{id:10,recruit:'occultist',joinLevel:level});
}
const revision2=b=>b.honroAct2Revision>=2;
function lowerPool(z,amount){
 const level=z.surface[0][1]+amount,bed=z.bottom;
 if(!z.honroCarvedBasin)return{...z,surface:z.surface.map(([x,y])=>[x,y+amount]),points:[...z.surface.map(([x,y])=>[x,y+amount]),...bed.slice().reverse()]};
 const first=bed.findIndex(p=>p[1]>=level),last=bed.findLastIndex(p=>p[1]>=level);
 if(first<=0||last<first||last>=bed.length-1)return{...z,surface:[],bottom:[],points:[]};
 const cross=(a,b)=>[a[0]+(b[0]-a[0])*(level-a[1])/(b[1]-a[1]),level];
 const bottom=[cross(bed[first-1],bed[first]),...bed.slice(first,last+1),cross(bed[last],bed[last+1])];
 const surface=[[bottom[0][0],level],[bottom.at(-1)[0],level]];
 return{...z,surface,bottom,points:[...surface,...bottom.slice().reverse()]};
}
const steps=b=>b.honroAct2Steps||(revision2(b)?H.stages[b.honroStage-1].steps:G.HonroAct2Content.legacySteps[b.honroStage-11]);
const memory=b=>(b.honroState.act2??={version:1,done:{},events:{},rescued:[],checkpoints:[]});
const marker=(b,id)=>b.honroMarkers.find(m=>m.id===id);
function satisfied(b,s){const a=memory(b);if(a.done[s.id])return true;
 if(s.kind==='clear'){const plan=G.HonroAct2Plan.forStage(b.honroStage);if(s.cohorts==='all'&&(plan.bossWave&&!a.events['keeper-retaliation']||plan.progressWave&&!a.events['convoy-ambush']))return false;return enemiesFor(b,s).length===0;}
 if(s.kind==='hold'){const h=a.holds?.[s.id];return !!h&&h.progress>=s.rounds&&h.spawned>=(s.wave?.count||0);}
 if(s.kind==='destroy')return !!b.terrain.find(t=>t.id===s.id)?.broken;
 if(s.kind==='defeat'){const u=b.units.find(u=>u.id===s.target);return !!u&&(u.dead||u.honroSubdued);}
 return false;
}
function current(b){return steps(b).find(s=>!satisfied(b,s));}
function enemiesFor(b,s){return b.units.filter(u=>u.side===1&&!u.dead&&u.hp>0&&!u.honroSubdued&&(s.cohorts==='all'||s.cohorts===u.honroCohort));}
function visible(b,u){if(!u?.honroSpirit||!u.spiritHidden||u.manifested||u.revealSpiritToParty)return true;const viewer=b.units.find(v=>v.id===b.active);return viewer?.side===0?!!viewer.spiritSight:!!b.units.find(v=>v.id===memory(b).viewerId)?.spiritSight;}
function scaleEncounter(u,hp,attack){const ratio=u.maxHp>0?u.hp/u.maxHp:1;
 u.maxHp=Math.max(1,Math.round(u.maxHp*hp));u.hp=Math.max(u.dead?0:1,Math.round(u.maxHp*ratio));
 if(Number.isFinite(u.combatBaseHp))u.combatBaseHp*=hp;
 u.attack*=attack;if(Number.isFinite(u.combatBaseAttack))u.combatBaseAttack*=attack;
}
function tuneEncounter(u,stage=0){
 const late=stage>=17&&stage<=20;
 if(u.honroAct2Tuned){
  // Old revision-2 saves keep their battle state but receive the late-act
  // attrition correction exactly once when resumed.
  if(late&&!u.honroAct2LateTuned){scaleEncounter(u,.85,.65);u.honroAct2LateTuned=true;}
  return;
 }
 u.honroAct2Tuned=true;
 // Mandatory clear/defense waves make total work much larger than revision 1.
 // Keep each opponent dangerous without making attrition across 20–40 bodies
 // depend on out-of-combat healing that the engine does not provide.
 scaleEncounter(u,.78,.75);
 if(u.honroAct2Elite&&!u.honroAct2Boss&&u.honroType!=='hoist'){u.elite=true;u.hp=u.maxHp=Math.round(u.maxHp*1.55);u.combatBaseHp*=1.55;u.attack*=1.15;u.combatBaseAttack*=1.15;u.honroXpWeight=(u.honroXpWeight||1)*1.6;u.name='정예 '+u.name;}
 if(late){scaleEncounter(u,.85,.65);u.honroAct2LateTuned=true;}
}
function state(b){const list=steps(b),index=list.findIndex(s=>!satisfied(b,s)),s=index<0?null:list[index],m=s&&marker(b,s.id),t=s&&b.terrain.find(t=>t.id===s.id),u=s&&b.units.find(u=>u.id===s.target),done=index<0?list.length:index;
 const target=s?{id:s.id,kind:s.kind==='destroy'?'seal':s.kind==='defeat'?'boss':s.kind==='reach'||s.kind==='escort'?'exit':'interact',x:u?.x??m?.x??(t?t.x+t.w/2:0),y:u?u.y-u.h:m?.y??t?.y??0,label:s.label,unitId:u?.id,box:t}:null;
 let detail='';
 if(s?.kind==='clear'){const foes=enemiesFor(b,s),hero=b.units.find(u=>u.id===b.active),next=foes.filter(u=>visible(b,u)).sort((u,v)=>Math.hypot(u.x-(hero?.x||0),u.y-(hero?.y||0))-Math.hypot(v.x-(hero?.x||0),v.y-(hero?.y||0)))[0];detail=' · 남은 적 '+foes.length;if(next)Object.assign(target,{x:next.x,y:next.y-next.h,kind:'boss'});}
 if(s?.kind==='hold'){const hold=memory(b).holds?.[s.id];detail=` · ${hold?.progress||0}/${s.rounds}턴${hold?.contested?' · 진 안의 적을 밀어내세요':hold?.guarded?' · 방어 중':' · 표시 범위에서 유지'}`;}
 const complete=!s;return{complete,objectiveReady:complete,minimumRound:1,settleRounds:0,summary:`${done}/${list.length} · ${s?s.label+detail:'모든 목표 완료'}`,targets:target?[target]:[],allTargets:list.map(q=>{const p=marker(b,q.id)||b.terrain.find(t=>t.id===q.id)||b.units.find(u=>u.id===q.target)||{};return{id:q.id,kind:q.kind==='destroy'?'seal':q.kind==='defeat'?'boss':q.kind==='reach'||q.kind==='escort'?'exit':'interact',x:q.kind==='destroy'?(p.x||0)+(p.w||0)/2:p.x||0,y:p.y||0,label:q.label,done:satisfied(b,q)};})};
}
function eligibility(app,m){const b=app.engine.b,s=current(b),a=memory(b),u=app.engine.active;
 if(m.id==='rebuild-brace')return {ok:!!a.collapse&&!a.rebuilt,reason:'E · 낙석 치우기'};
 if(m.id.startsWith('spirit-lamp'))return {ok:true,reason:'E · 주변 원혼등불 밝히기'};
 if(!s||s.id!==m.id)return{ok:false,reason:s?'먼저 '+s.label:'목표 완료'};
 if(['clear','hold','defeat','destroy','reach','escort'].includes(s.kind))return{ok:false,reason:s.label};
 if(s.requiredClass&&u.cls!==s.requiredClass)return{ok:false,reason:H.hero[s.requiredClass].name+' 필요'};
 if(revision2(b)){
  const threats=b.units.filter(v=>v.side===1&&!v.dead&&!v.honroSubdued&&v.id!==m.spiritId&&!v.honroAct2Boss&&Math.hypot(v.x-m.x,v.y-m.y)<360);
  if(threats.length)return{ok:false,reason:'주변 들림을 먼저 제압하세요'};
  const spirit=b.units.find(v=>v.id===m.spiritId);
  if(s.kind==='rescue'&&spirit&&!spirit.dead&&spirit.hp>spirit.maxHp*.4)return{ok:false,reason:'붙은 혼을 먼저 약화시키세요 · 체력 40% 이하'};
 }
 if(m.id==='repair'&&a.collapse&&!a.rebuilt)return{ok:false,reason:'먼저 떨어진 돌을 치우세요'};
 if(s.kind==='rescue'&&u.cls!=='occultist'){
  const spirit=b.units.find(v=>v.id===m.spiritId);
  if(spirit&&!spirit.dead&&!spirit.honroSubdued)return{ok:false,reason:'소단으로 분리하거나 곁의 혼을 먼저 제압'};
 }
 return{ok:true,reason:'E · '+m.label};
}
function say(app,id,lines){if(!lines?.length)return;app.sayLines(G.HonroAct2Content.scene('act2-'+app.stage.id+'-'+id,app.stage.name,lines));}
function completeStep(app,s){const e=app.engine,b=e.b,a=memory(b);if(a.done[s.id])return;
 a.done[s.id]=true;a.checkpoints.push({id:s.id,round:b.round});
 const m=marker(b,s.id);if(m)m.collected=true;
 say(app,s.id,app.stage.beats?.[s.id]);app.event(s.label+' · 완료');app.dirty=true;
}
function wave(app,key,kind,n=2,siteKey=key,eliteEvery=4){const e=app.engine,b=e.b,a=memory(b);if(a.events[key])return true;
 const site=marker(b,'wave-'+siteKey)||marker(b,'wave');if(!site)return false;
 const previous=new Set(b.units.map(u=>u.id));
 if(G.HonroAllies.execute(app,{type:'spawn',n,kind,x:site.x,y:site.y,spacing:130,maxDistance:450,source:key})===false)return false;
 if(revision2(b)){let index=0;for(const u of b.units)if(!previous.has(u.id)&&u.side===1){u.honroCohort='reinforcement';u.honroAct2Elite=++index%eliteEvery===0||n>=3&&index===n;u.honroAct2Revision=2;tuneEncounter(u,b.honroStage);}}
 a.events[key]=true;a.pulseRound=b.round;a.pulseUntil=(b.time||0)+1.8;app.event('종의 잔울림을 따라 '+G.HonroWorld.archetypes[kind].name+' 등장');return true;
}
function expose(b,until,site,radius=Infinity){for(const u of b.units)if(u.honroSpirit&&!u.dead&&(!site||Math.hypot(u.x-site.x,u.y-site.y)<=radius)){u.manifested=true;u.revealSpiritToParty=true;u.manifestedUntil=Math.max(u.manifestedUntil||0,until);u.formDamageTakenBonus=Math.max(u.formDamageTakenBonus||0,.92);}}
function use(app,m){const e=app.engine,b=e.b,a=memory(b),s=current(b);
 if(!eligibility(app,m).ok)return false;
 if(m.id.startsWith('spirit-lamp')){expose(b,b.round+2,m,m.radius||1200);app.event('원혼등불 · 주변의 혼이 두 턴 동안 형태를 드러낸다.');}
 else if(m.id==='rebuild-brace'){a.rebuilt=true;m.collected=true;const debris=b.terrain.find(t=>t.id==='gate-debris');if(debris)debris.broken=true;b.sceneVersion++;app.event('낙석을 치웠다. 인양축에 다시 접근할 수 있다.');}
 else{
  if(!s||s.id!==m.id)return false;
  if(s.kind==='rescue'){
   const spirit=e.unit(m.spiritId),resident=e.unit(m.target);if(!resident||resident.dead)return false;
   // Extraction attacks the possessing spirit, never the person's HP.
   if(spirit&&!spirit.dead){G.HonroProgression.defeat(e,spirit,e.active);spirit.hp=0;spirit.dead=true;spirit.honroReleased=true;}
   resident.honroResolved=true;resident.shield=Math.max(resident.shield,Math.round(resident.maxHp*.3));a.rescued.push(resident.id);
  }
  if(s.id==='sluice'){
   b.honroSurfaceZones=b.honroSurfaceZones.map(z=>z.kind==='water-pool'?lowerPool(z,120):z);
   const pools=b.honroSurfaceZones.filter(z=>z.kind==='water-pool'&&z.surface.length===2);
   b.waters=pools.map((z,j)=>({...(b.waters[j]||{}),x:z.surface[0][0],y:z.surface[0][1],w:z.surface[1][0]-z.surface[0][0],depth:Math.max(...z.bottom.map(p=>p[1]))-z.surface[0][1],bottom:z.bottom.map(([x,y])=>({x,y}))}));
   const block=b.terrain.find(t=>t.id==='water-gate');if(block)block.broken=true;b.sceneVersion++;
  }
  if(['gate','bridge','repair'].includes(s.id)){const barrier=b.terrain.find(t=>t.id==='gate-'+s.id);if(barrier)barrier.broken=true;b.sceneVersion++;}
  if(s.id==='silence'){a.silenced=true;expose(b,b.round+2);}
  if(s.id==='leak'){expose(b,b.round+3);for(const u of b.units.filter(u=>u.honroSpirit&&!u.dead)){u.shield=0;u.bound=Math.max(u.bound,1);}}
  if(s.id==='route'){a.routeOpen=true;for(const u of b.units.filter(u=>u.honroProtected))u.shield=Math.max(u.shield,80);}
  if(s.id.startsWith('separate-')){if(!revision2(b)){a.pendingWaves??=[];a.pendingWaves.push({key:s.id,kind:s.id==='separate-3'?'bellCluster':'echo',n:2});}expose(b,b.round+2,m,900);}
  if(s.id.startsWith('send-')){for(const u of e.heroesAlive()){u.focus=Math.min(u.maxFocus,u.focus+25);}app.event('혼이 임시 그릇을 떠나 바깥 길로 흘러간다.');}
  if(s.id==='escort')a.escort=true;
  completeStep(app,s);
 }
 if(!app.checkMission(e))e.finishAction();app.dirty=true;return true;
}
function attach(app,e){if(!active(e.b))return;
 if(revision2(e.b))for(const u of e.b.units)if(u.side===1)tuneEncounter(u,e.b.honroStage);
 const manifest=e.manifest.bind(e);e.manifest=function(target,...args){const out=manifest(target,...args);if(target.honroSpirit&&target.manifested)target.formDamageTakenBonus=Math.max(target.formDamageTakenBonus,.92);return out;};
 const damage=e.hurt.bind(e);e.hurt=function(u,amount,...args){
  const source=e.unit(args[0]);
  if(u.honroProtected&&source?.side===0)return;
  if(u.honroAct2Boss&&!memory(e.b).done.leak)amount*=.12;
  if(u.honroSubdued)return;
  const out=damage(u,amount,...args);
  if(u.honroNonlethal&&u.hp<=1&&!u.dead){G.HonroProgression.defeat(e,u,source);u.honroSubdued=true;u.side=2;u.fixed=true;u.acted=true;u.vx=u.vy=0;e.b.queue=e.b.queue.filter(id=>id!==u.id);e.message('종지기를 전투 불능으로 제압했다.');}
  return out;
 };
 const terrain=e.damageTerrain.bind(e);e.damageTerrain=function(t,amount,depth=0,owner=e.b.active){
  const s=steps(e.b).find(s=>s.id===t.id),u=e.unit(owner);
  if(s?.requiredClass&&u?.cls!==s.requiredClass){e.message(H.hero[s.requiredClass].name+'의 정밀사격이 필요하다.');return;}
  if(t.id==='upper-chain'&&!memory(e.b).silenced){e.message('공명을 먼저 억제해야 고정점이 드러난다.');return;}
  const before=t.broken,out=terrain(t,amount,depth,owner);
  if(!before&&t.broken){
   if(t.id==='rock-pin'){const floor=e.b.terrain.find(t=>t.id==='act2-floor');if(floor?.honroRestoredVertices){floor.vertices=floor.honroRestoredVertices.map(p=>({...p}));delete floor.honroRestoredVertices;e.b.sceneVersion++;}}
   if(t.id==='exit-pin'){const gate=e.b.terrain.find(t=>t.id==='gate-exit');if(gate){gate.broken=true;e.b.sceneVersion++;}}
   if(t.id==='collapse-pin'&&!memory(e.b).done.brace){memory(e.b).collapse=true;for(const p of e.heroesAlive())if(Math.abs(p.x-t.x)<550)e.hurt(p,p.maxHp*.18,undefined,false,undefined,undefined,'environment');const m=marker(e.b,'rebuild-brace');if(m)m.collected=false;const debris=e.b.terrain.find(t=>t.id==='gate-debris');if(debris)debris.broken=false;e.b.sceneVersion++;e.message('버팀목 없이 돌이 무너졌다. 안전 지지대를 세우고 낙석을 치워야 한다.');}
   if(t.honroRockfall){for(const p of e.b.units)if(!p.dead&&p.x>t.x-150&&p.x<t.x+t.w+150&&p.y>t.y)e.hurt(p,Math.round(p.maxHp*.28),owner,false,undefined,undefined,'environment');}
  }
  return out;
 };
}
function failure(b){if(!active(b))return null;const list=steps(b),a=memory(b);
 if(b.units.some(u=>u.honroProtected&&(u.dead||u.hp<=0)))return '보호하던 주민을 잃었다. 구조 경로를 다시 확보해야 한다.';
 const needed=list.filter(s=>!satisfied(b,s)&&s.requiredClass).map(s=>s.requiredClass);
 for(const cls of new Set(needed))if(!b.units.some(u=>u.side===0&&u.cls===cls&&!u.dead&&u.hp>0))return H.hero[cls].name+'이 쓰러져 남은 의식을 이어갈 수 없다.';
 return null;
}
function tick(app,dt){const e=app.engine,b=e.b;if(!active(b)||['won','lost'].includes(b.phase))return;
 const a=memory(b),heroes=e.heroesAlive();
 if(e.active?.side===0)a.viewerId=e.active.id;
 // Completion is captured immediately; the shared story queue waits for actor end.
 for(const s of steps(b)){if(a.done[s.id])continue;if(!satisfied(b,s))break;completeStep(app,s);}
 const s=current(b),m=s&&marker(b,s.id);
 if(revision2(b)&&s?.kind==='hold'&&m){
  a.holds??={};const h=a.holds[s.id]??={progress:0,spawned:0,lastRound:b.round,enteredRound:b.round,continuous:false};
  const guarded=heroes.some(u=>(!s.requiredClass||u.cls===s.requiredClass)&&Math.hypot(u.x-m.x,u.y-m.y)<s.radius),contested=b.units.some(u=>u.side===1&&!u.dead&&Math.hypot(u.x-m.x,u.y-m.y)<s.contestRadius);
  if(!guarded||contested)h.continuous=false;
  if(b.round>h.lastRound){if(h.continuous&&guarded&&!contested)h.progress++;h.lastRound=b.round;h.continuous=guarded&&!contested;app.dirty=true;}
  if(h.guarded===undefined)h.continuous=guarded&&!contested;
  h.guarded=guarded;h.contested=contested;
  if(app.actorBoundary&&guarded&&!a.events['story:'+s.id]){a.events['story:'+s.id]=true;say(app,s.id+'-start',app.stage.beats?.[s.id+':start']);}
  if(app.actorBoundary&&guarded&&h.spawned<(s.wave?.count||0)&&h.waveRound!==b.round){const n=Math.min(3,s.wave.count-h.spawned),key=s.id+'-'+h.spawned;if(wave(app,key,s.wave.kind,n,s.id,s.wave.eliteEvery)){h.spawned+=n;h.waveRound=b.round;}}
 }
 if(s?.kind==='reach'&&heroes.some(u=>Math.hypot(u.x-m.x,u.y-m.y)<150))completeStep(app,s);
 if(s?.kind==='escort'&&a.escort){const npc=e.unit('objective'),leader=heroes.filter(u=>u.y<=(npc?.y??0)+160).sort((u,v)=>v.x-u.x)[0];
  if(npc&&!npc.dead&&leader&&leader.x>npc.x+90&&dt>0){e.walk(npc,1,Math.min(dt,.05));npc.moveLeft=900;}
  if(npc&&Math.hypot(npc.x-m.x,npc.y-m.y)<170)completeStep(app,s);
 }
 if(app.actorBoundary){
  a.pendingWaves??=[];
  const triggers={12:['sign','minecart'],13:['gate','picks'],14:['family-upper','echo'],15:['sluice','waterwheel'],16:['hall','stoneLantern'],17:['repair','resonance'],18:['silence','bellCluster'],20:['escort','minecart']};
  const trigger=triggers[b.honroStage];if(!revision2(b)&&trigger&&a.done[trigger[0]]&&!a.events[trigger[0]])wave(app,...trigger);
  for(const w of a.pendingWaves)if(wave(app,w.key,w.kind,w.n))w.done=true;
  a.pendingWaves=a.pendingWaves.filter(w=>!w.done);
  // Resonance periodically spills only until the player actually silences the bell.
  if(!revision2(b)&&b.honroStage===18&&!a.silenced&&b.round>=3&&!a.events['bell-first'])wave(app,'bell-first','echo',2);
  if(revision2(b)){
   const plan=G.HonroAct2Plan.forStage(b.honroStage),boss=e.unit('act2-keeper'),convoy=e.unit('objective');
   if(plan.bossWave&&boss&&boss.hp<=boss.maxHp*.6&&!a.events['keeper-retaliation'])wave(app,'keeper-retaliation',plan.bossWave.kind,plan.bossWave.count,'wave',plan.bossWave.eliteEvery);
   if(plan.progressWave&&a.escort&&convoy?.x>=4400&&!a.events['convoy-ambush'])wave(app,'convoy-ambush',plan.progressWave.kind,plan.progressWave.count,'hold-convoy',plan.progressWave.eliteEvery);
  }
  for(const u of b.units.filter(u=>u.honroEcho&&!u.dead&&!u.manifested)){
   u.honroEchoBorn??=b.round;
   if(b.round-u.honroEchoBorn>=2&&!u.honroPossessed){const d=G.HonroWorld.archetypes.picks;u.honroPossessed=true;u.name='잔향이 든 곡괭이';u.honroType='picks';u.honroVariant='picks';u.loadout=[...d.skills];u.ranks.H2PICK=1;u.honroSpirit=false;u.spiritHidden=false;u.fixed=false;u.existenceDefense={form:1,qi:1,soul:1.1};u.y=G.HonroWorld.top(b,u.x,u.y);e.message('방치된 잔향혼이 작업도구에 들었다.');}
  }
 }
 app.checkMission(e);
}
function entry(app,options={}){return [...(options.interlude===false?[]:app.stage.narration).map(text=>['서술',text,{kind:'narration',art:'road'}]),...app.stage.story,G.HonroAct2Content.guide(app.stage.guide)];}
G.HonroAct2={active,configureEnemy,recruit,memory,current,state,eligibility,use,attach,tick,failure,entry,expose,steps,enemiesFor,visible,revision2,tuneEncounter};
})(globalThis);
