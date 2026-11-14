(function(G){'use strict';
const active=b=>b?.honroAct5===1&&!b.honroCustom;
const design=b=>b.honroMap.act5;
const memory=b=>b.honroState.act5??={step:0,beats:{}};
const alive=u=>u&&!u.dead&&u.hp>0;
const heroes=b=>b.units.filter(u=>u.side===0&&!u.summoned&&alive(u));
const escorts=b=>b.units.filter(u=>u.honroAct5Escort);
const group=(b,key)=>b.units.filter(u=>design(b).groups[key]?.includes(u.id));
const near=(u,{x,y},radius=185)=>Math.abs(u.x-x)<=radius&&Math.abs(u.y-y)<=115&&!u.airborne;
const revised=b=>active(b)&&design(b)?.encounterVersion===2;
const floorHP=u=>Math.ceil(u.maxHp*.29);
function damageFloor(b,u){
 if(!active(b)||u.side!==1)return 0;
 if(b.honroStage===43&&design(b).groups.commander.includes(u.id)){
  return revised(b)&&group(b,'banner').some(alive)?Math.ceil(u.maxHp*.73):floorHP(u);
 }
 if(revised(b)&&b.honroStage===45&&u.honroAct5Role==='elite'&&group(b,'bier').includes(u)&&group(b,'tether').some(alive))
  return Math.ceil(u.maxHp*.62);
 return 0;
}
const phase=b=>design(b).flow[memory(b).step];
const target=(id,kind,point,label)=>({id,kind,x:point.x,y:point.y,label});
function state(b){
 const d=design(b),m=memory(b),row=phase(b),party=heroes(b),all=d.flow.map(([,key,text],i)=>({...target('a5-step-'+i,'route',d.sites[key],text),done:i<m.step}));
 let text=row?.[2],targets=[],complete=false;
 if(!row){
  const n=party.filter(u=>near(u,d.sites.exit,315)).length;
  complete=party.length>0&&n===party.length;
  text=complete?'출구 집결 완료':(b.honroStage===46?'동쪽 절벽 아래 석단에 집결':b.honroStage===47?'오른쪽 상층 비상 통로에 집결':'생존 동행을 출구에 모으기')+' · '+n+'/'+party.length;
  targets=[target('a5-exit','exit',d.sites.exit,text)];
 }else{
  const [kind,key]=row,point=d.sites[key];
  if(kind==='fight'||kind==='subdue'){
   const enemies=fightTargets(b,key);
   if(b.honroStage===45&&key==='tether'&&enemies[0]?.honroObjectiveTarget)text='상여에 연결된 결박 파괴';
   const hint=G.HonroObjectiveGuide.hostileHint(b,enemies,text);
   targets=hint.targets;
   if(kind==='subdue'&&enemies.length)text+=' · 남은 체력 '+Math.ceil(enemies[0].hp)+'/'+enemies[0].maxHp;
   else if(enemies.length)text=enemies.every(u=>u.honroObjectiveTarget)?text+' · '+enemies.map(u=>u.name+' '+Math.ceil(u.hp)+'/'+u.maxHp).join(', '):hint.text;
  }else if(kind==='pass'){
   const upper=fightTargets(b,'rootsUpper'),lower=fightTargets(b,'rootsLower');
   text='위 뿌리 능선 '+upper.length+'기 또는 아래 골 '+lower.length+'기 · 한쪽 길만 확보';
   targets=G.HonroObjectiveGuide.hostileTargets(b,[...upper,...lower]);
  }else if(kind==='escort'){
   const residents=escorts(b).filter(alive),arrived=residents.filter(u=>near(u,point));
   text+=' · '+arrived.length+'/'+escorts(b).length+' · 같은 층에서 앞서 이동';
   targets=[target('a5-escort-destination','route',point,'호송 도착지')];
   const next=residents.find(u=>!near(u,point));
   if(next)targets.unshift({...target(next.id,'escort',{x:next.x,y:next.y-next.h},next.name+' · 엄호'),unitId:next.id});
  }else if(kind==='hold'){
   text+=heroes(b).some(u=>near(u,point,260))?' · 적 턴 1회 동안 자리 지키기':' · 동행을 중앙 석단에 배치';
   targets=[target('a5-hold','route',point,text)];
  }else targets=[target('a5-step-'+m.step,kind==='use'?'interact':'route',point,text)];
  if(revised(b)&&kind==='fight'&&waitingWave(b,key))text+=' · 이 길로 접근하는 적이 있습니다';
  if(b.honroStage===46&&key==='stakeOne'&&party.some(u=>u.y<d.sites.memory.y+90))
   text+=' · 시작 절벽 끝의 하강 밧줄 사용';
 }
 const exits=complete?[]:targets,checklist=[...all.map((v,i)=>({id:v.id,text:v.label,done:v.done,current:i===m.step})),{id:'a5-exit',text:'생존 동행 출구 집결',current:!row&&!complete,done:complete}];
 return {complete,objectiveReady:complete,summary:text,currentInstruction:text,targets:exits,allTargets:[...all,...exits],checklist,visibleChecklist:checklist};
}
function fightTargets(b,key){
 if(b.honroStage===42&&key==='drum'&&group(b,'captain').filter(u=>!revised(b)||u.honroAct5Role==='elite').every(u=>!alive(u)))return [];
 if(!revised(b)&&b.honroStage===45&&key==='tether'&&!group(b,key).some(alive))return group(b,'bier').filter(alive);
 return group(b,key).filter(alive);
}
function failure(b){
 const stage=b.honroStage;
 if([41,42].includes(stage)&&escorts(b).some(u=>!alive(u)))return '호송해야 할 사람을 잃었습니다.';
 const remaining=design(b).flow.slice(memory(b).step);
 for(const cls of ['mage','occultist'])if(remaining.some(row=>row[3]===cls)&&!heroes(b).some(u=>u.cls===cls))
  return G.HONRO_CONTENT.hero[cls].name+'가 쓰러져 다음 기믹을 진행할 수 없습니다.';
 return null;
}
function storyline(app,key){
 const b=app.engine.b,m=memory(b),lines=design(b).beats[key];
 if(!lines?.length||m.beats[key])return;
 m.beats[key]=true;
 const scene=G.HonroStoryContent.scene('act5-'+b.honroStage+'-'+key,app.stage.name,lines);
 if((b.honroStage===46&&key==='memory')||(b.honroStage===50&&key==='view'))scene.forEach(row=>{row[2]={...row[2],act5Vista:true};});
 if(app.canInput())G.HonroStory.start(app,scene,{title:app.stage.name});
 else app.sayLines(scene);
}
function entry(app){
 return [...G.HonroStoryContent.scene('act5-entry-'+app.stage.id,app.stage.name,app.stage.story),
   ['안내',state(app.engine.b).currentInstruction,{kind:'guide',storyId:'guide-'+app.stage.id,storyTitle:app.stage.name+' · 길잡이'}]];
}
function advance(app){
 const b=app.engine.b,m=memory(b),[kind,key]=phase(b);
 m.step++;delete m.holdStart;app.dirty=true;
 if(b.honroStage===46&&kind==='fight'||revised(b)&&b.honroStage===43&&kind==='subdue')return;
 storyline(app,b.honroStage===47&&kind==='hold'?'reverse':b.honroStage===47&&key==='center'?'shutdown':b.honroStage===48&&key==='center'?'stabilize':key);
}
function escort(app,point,dt){
 const b=app.engine.b,party=heroes(b);
 for(const u of escorts(b).filter(alive)){
  if(near(u,point)||!party.some(h=>h.x>=u.x-55&&Math.abs(h.x-u.x)<570&&Math.abs(h.y-u.y)<125&&!h.airborne))continue;
  const x=Math.min(point.x,u.x+dt*230);
  const hit=G.HonroMapEngine.surfaceY(b.terrain,x,u.y);
  if(!hit||Math.abs(hit.y-u.y)>19)continue;
  u.x=x;u.y=hit.y;u.facing=1;app.dirty=true;
 }
}
function placeFoe(b,u,range){
 const flying=G.HONRO_CORE.flyingEnemy(u),y=u.spawnY;
 return G.HonroTerrain.place(b,u,{x:u.spawnX,y,flying,maxDistance:range,
  accept:(_x,py)=>Math.abs(py-y)<(flying?260:104)});
}
function prepare(b,stage){
 if(!revised(b))return;
 const P=G.HonroProgression,C=G.HONRO_CORE;
 const placed=b.units.filter(u=>u.side!==1);
 for(const u of b.units.filter(u=>u.side===1)){
  if(u.honroAct5Role==='commander'){u.armor=.16;P.tuneBoss(b,stage,u);}
  else if(u.honroAct5Role==='elite'){u.armor=.12;P.tuneMidboss(b,stage,u);}
  else {
   u.armor=({warden:.13,mourner:.09,boar:.07})[u.honroVariant]??.04;
   P.tuneEnemy(stage,u,u.honroVariant);
  }
  C.migrateAirborneBalance(u);
  if(u.honroAct5Reserve)continue;
  const spot=placeFoe({...b,units:placed},u,384);
  if(!spot)throw Error('Act 5 support or spawn space: '+stage.id+' '+u.name+' '+u.x+' '+u.y);
  Object.assign(u,spot,{spawnX:spot.x,spawnY:spot.y});
  placed.push(u);
 }
}
function waitingWave(b,key){
 const guards=design(b).groups[key]||[];
 return b.units.some(u=>guards.includes(u.id)&&u.honroAct5Reserve);
}
function waveReady(b,wave){
 const row=phase(b),m=memory(b);
 if(wave.when==='commander'){
  const u=group(b,'commander')[0];
  return alive(u)&&u.side===1&&u.hp<=u.maxHp*.65;
 }
 if(wave.when==='reverse'||wave.when==='stable')return m.field===wave.when;
 if(row?.[1]!==wave.key)return false;
 if(wave.when==='drum')return fightTargets(b,'drum').length>0;
 if(wave.when==='reach')return heroes(b).some(u=>near(u,design(b).sites[wave.key],260));
 if(wave.when==='summit')return row[0]==='fight';
 return true;
}
function updateWaves(app){
 const e=app.engine,b=e.b,m=memory(b);
 m.waves??={};
 for(const wave of design(b).waves){
  if(m.waves[wave.id]==='arrived')continue;
  if(wave.when==='drum'&&!fightTargets(b,'drum').length&&m.waves[wave.id]){m.waves[wave.id]='arrived';app.dirty=true;continue;}
  if(!m.waves[wave.id]){
   if(!waveReady(b,wave))continue;
   m.waves[wave.id]='pending';app.notify(wave.text);app.dirty=true;
  }
  const pending=b.units.filter(u=>wave.units.includes(u.id)&&u.honroAct5Reserve);
  if(b.projectiles.length||e.settleBusy())continue;
  for(const u of pending){
   const spot=placeFoe(b,u,480);
   if(!spot)continue;
   Object.assign(u,spot,{spawnX:spot.x,spawnY:spot.y,dead:false,awake:true,aggroUntil:b.round+2});
   delete u.honroAct5Reserve;
   b.honroCounters.spawned++;app.dirty=true;
   e.fx('ring',u.x,u.y-25,'#baa9c6',49);
  }
  if(pending.every(u=>!u.honroAct5Reserve))m.waves[wave.id]='arrived';
 }
}
function legacyReaction(app){
 const e=app.engine,b=e.b,m=memory(b),id=b.honroStage;
 if(id===42&&phase(b)?.[1]==='drum'&&fightTargets(b,'drum').length&&(m.drumsHeard||0)<3&&m.lastDrum!==b.round){
  m.lastDrum=b.round;m.drumsHeard=(m.drumsHeard||0)+1;app.dirty=true;
  for(const u of group(b,'captain').filter(alive)){u.awake=true;u.aggroUntil=b.round+1;}
  const drum=group(b,'drum').find(alive);
  if(drum)e.fx('ring',drum.x,drum.y-48,'#c7a27c',105);
 }
 if(id===43&&!m.armorWave){
  const commander=group(b,'commander')[0];
  if(!commander||commander.hp>commander.maxHp*.65)return;
  m.armorWave=true;app.dirty=true;
  for(const u of group(b,'armorWave')){u.dead=false;u.awake=true;u.aggroUntil=b.round+1;e.fx('ring',u.x,u.y-24,'#9caec7',50);}
 }
}
function tick(app,dt){
 const e=app.engine,b=e.b;
 if(app.done||['won','lost'].includes(b.phase))return;
 if(revised(b))updateWaves(app);
 else legacyReaction(app);
 const row=phase(b);
 if(row){
  const [kind,key]=row,point=design(b).sites[key],m=memory(b),inside=heroes(b).some(u=>near(u,point,260));
  if(!revised(b)&&b.honroStage===41&&kind==='fight'&&key==='watch')escort(app,design(b).sites.guide,dt);
  if(b.honroStage===45&&['tether','turnback'].includes(key))escort(app,design(b).sites.turnback,dt);
  if(kind==='reach'&&inside||kind==='fight'&&!fightTargets(b,key).length&&(!revised(b)||!waitingWave(b,key))||
      kind==='pass'&&['rootsUpper','rootsLower'].some(lane=>!fightTargets(b,lane).length)||
      kind==='subdue'&&group(b,key).some(u=>alive(u)&&u.hp<=floorHP(u)))advance(app);
  else if(kind==='escort'){
   escort(app,point,dt);
   if(escorts(b).every(u=>alive(u)&&near(u,point)))advance(app);
  }else if(kind==='hold'){
   if(!inside)delete m.holdStart;
   else{
    m.holdStart??=(b.teamEnds?.[1]||0)+(b.side===1&&b.phase!=='transition'?1:0);
    if((b.teamEnds?.[1]||0)>m.holdStart){
     if(b.honroStage===47)setFlow(e,'reverse');
     if(b.honroStage===48)setFlow(e,'fading');
     advance(app);
    }
   }
  }
 }
 if(!app.dialogue)app.checkMission(e);
}
function finishedUse(b,key){return design(b).flow.slice(0,memory(b).step).some(row=>row[0]==='use'&&row[1]===key);}
function current(b,m){
 if(!active(b))return false;
 return design(b).links.some(l=>l.id===m.id)||phase(b)?.[0]==='use'&&m.id==='a5-step-'+memory(b).step;
}
function interaction(e,m){
 const link=design(e.b).links.find(l=>l.id===m.id);
 const to=link&&[0,42,-42,84,-84,126,-126,168,-168,210,-210].map(dx=>{
  const x=link.to.x+dx,hit=G.HonroMapEngine.surfaceY(e.b.terrain,x,link.to.y);
  return hit&&Math.abs(hit.y-link.to.y)<48?{x,y:hit.y}:null;
 }).find(p=>p&&!e.b.units.some(u=>alive(u)&&!u.summoned&&u!==e.active&&Math.abs(u.y-p.y)<65&&Math.abs(u.x-p.x)<u.r+e.active.r));
 return {link,to};
}
function eligibility(app,m){
 const e=app.engine,b=e.b,u=e.active,row=phase(b);
 if(!current(b,m))return {ok:false,reason:'앞선 목표를 먼저 진행하세요'};
 const {link,to}=interaction(e,m),required=row?.[3];
 if(!near(u,m,link?145:215)||!e.grounded(u)||link&&Math.abs(u.y-link.y)>52)return {ok:false,reason:'표식과 같은 발판에 서세요'};
 if(link&&b.honroStage===46&&link.id==='a5-cross-2'&&!finishedUse(b,'stakeOne'))return {ok:false,reason:'서쪽 진목을 설치해 중앙 석단으로 건너세요'};
 if(link&&b.honroStage===46&&link.id==='a5-cross-6'&&row)return {ok:false,reason:'두 진목을 설치해 하강 밧줄을 여세요'};
 if(link&&b.honroStage===47&&link.id==='a5-cross-0'&&memory(b).field!=='shutdown')return {ok:false,reason:'담허로 진을 거둔 뒤 상층 비상 통로를 이용하세요'};
 if(link&&b.honroStage===49&&link.id==='a5-cross-6'&&row)return {ok:false,reason:'역행귀를 제압한 뒤 상층 진목길을 쓰세요'};
 if(link&&u.moveLeft<150)return {ok:false,reason:'이동도 150 필요 · 다음 아군 턴에 건너세요'};
 if(link&&!to)return {ok:false,reason:'건너편 발판을 비워 주세요'};
 if(!link&&required&&u.cls!==required){const name=G.HONRO_CONTENT.hero[required].name;return {ok:false,reason:name+(required==='mage'?'로':'으로')+' 전환'};}
 return {ok:true,reason:m.label,routePriority:link&&Number(link.id.split('-').at(-1))%2===0?1:0};
}
function use(app,m){
 const e=app.engine,b=e.b,u=e.active,{link,to}=interaction(e,m);
 if(link){
  if(!to)return false;
  e.fx('ring',m.x,m.y-18,'#beb291',36);
  G.HonroObjectiveContributions?.interact(b,m.id,u);
  Object.assign(u,to,{vx:0,vy:0,airborne:false,jumping:false});delete u.platformDrop;delete u.moveTarget;delete u.groundContact;
  u.moveLeft-=150;
  app.scene.manual=false;app.scene.x=u.x;app.scene.y=u.y-120;
  e.fx('ring',u.x,u.y-18,'#beb291',42);
 }else{
  const [,key]=phase(b);
  if(b.honroStage===43&&key==='commander'){
   const commander=group(b,key)[0];if(!alive(commander))return false;
   commander.side=2;commander.honroAlly=true;commander.fixed=true;commander.loadout=[];commander.awake=false;commander.aggroUntil=0;
   b.queue=b.queue.filter(id=>id!==commander.id);
   e.fx('ring',commander.x,commander.y-55,'#beabcb',95);
  }
  if(b.honroStage===47&&key==='stakeTwo')setFlow(e,'trial');
  if(b.honroStage===47&&key==='center')setFlow(e,'shutdown');
  if(b.honroStage===48&&key==='center')setFlow(e,'stable');
  if(b.honroStage===48&&key==='tools')setFlow(e,'shutdown');
  e.fx('ring',m.x,m.y-20,'#9ebdb0',62);
  G.HonroObjectiveContributions?.interact(b,m.id,u);
  advance(app);
 }
 app.dirty=true;app.updateHUD(true);
 return true;
}
function setFlow(e,mode){
 const b=e.b,x=b.width,y=b.height;
 const shafts=[
  {id:'act5-left',x:x*.24,y:y*.26,w:x*.22,h:y*.68,gravityScale:1.48,projectileOnly:true},
  {id:'act5-right',x:x*.54,y:y*.23,w:x*.23,h:y*.67,gravityScale:-.43,projectileOnly:true}
 ];
 const narrow={id:'act5-basin',x:x*.31,y:y*.36,w:x*.23,h:y*.27,gravityScale:-.28,projectileOnly:true};
 const fields={reverse:[shafts[1]],crossed:shafts,trial:[{...shafts[0],gravityScale:.65}],shutdown:[],unstable:[narrow],stable:[],fading:[{...narrow,gravityScale:.75}]};
 e.setEnvironment({regions:fields[mode]});
 memory(b).field=mode;
}
function attach(e){
 if(!active(e.b))return;
 const b=e.b,m=memory(b);
 if(!m.field&&b.honroStage===49)setFlow(e,'crossed');
 if(!m.field&&b.honroStage===48)setFlow(e,'unstable');
}
const chapterFlags=[
 ['blackCampCleared'],['gwakJinRescued'],['corruptedCommanderReleased'],['ghostForestEntered'],['seonangPassageSeen','dosikReturnsDownhill'],
 ['hyeonmukMemoryPlayed'],['prototypeFailedEvacuated'],['prototypeLimitedSuccess'],['invertedValleyCrossed'],['mumyungsaSeen']
];
function recordOutcome(app,won){
 const b=app.engine?.b;
 if(!won||!active(b)||b.honroJourneyReplay)return;
 for(const flag of chapterFlags[b.honroStage-41])app.profile.honroFlags['act5.'+flag]=true;
}
G.HonroAct5={active,recordOutcome,state,failure,entry,tick,current,eligibility,use,attach,prepare,damageFloor};
})(globalThis);
