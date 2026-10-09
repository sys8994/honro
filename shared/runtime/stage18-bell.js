(function(G){'use strict';
// Fresh bell expeditions opt in explicitly. Never upgrade an old Continue.
const A=G.HonroAct2,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE,H=G.HONRO_CONTENT;
const clone=x=>JSON.parse(JSON.stringify(x));
const legacy=clone(H.stages[17]),active=b=>b?.honroStage===18&&!b.honroCustom&&b.honroBellRevision===1;
const steps=legacy.steps.filter(s=>s.id!=='lower-chain').map(s=>s.id==='upper-chain'?{...s,label:'장력 고정구 해제',requiredClass:undefined,parallelGroup:'bell-stabilize'}:s.id==='hold-silence'?{...s,parallelGroup:'bell-stabilize'}:s);
steps.splice(steps.findIndex(s=>s.id==='leak'),0,{id:'bell-descent',label:'빈 쓸림면을 확인하고 대종 내려앉히기',kind:'bell-descent'});
// Map authoring copies these steps; the battle snapshot remains the authority.
Object.assign(H.stages[17],{steps:clone(steps),goal:'억제진과 장력 고정구를 함께 안정시켜 대종을 내리고, 누출혼과 종지기 제압',guide:'담허로 억제를 시작한 뒤 4라운드 유지와 장력 고정구 해제를 함께 진행하세요. 고정구는 서쪽 먼 사격턱의 기본 화살이나 가까운 정비턱의 기본 공격으로 풀 수 있습니다. 두 조건 뒤 종의 쓸림면을 비우면 한 번 내려앉습니다. 아래 영구바닥과 양쪽 귀환길은 남습니다. 소단의 누출혼 분리, 종지기 비살상 제압, 잔여 들림 제압으로 마칩니다.',beats:{...legacy.beats,
 'hold-silence':[['서술','담허의 옷자락이 떨림을 멈췄다. 종소리 아래에서 서로 다른 숨소리가 들렸다.'],['담허','울림은 잡혔네. 고정구만 풀리면 받침으로 무게를 옮길 수 있어.']],
 'upper-chain':[['서술','장력 고정구가 빠졌다. 긴 사슬이 느슨해졌지만, 종은 아직 위에 머물렀다.'],['휘겸','받침이 버티고 있소. 억제가 끝나면 종 아래 가장자리부터 비웁시다.']],
 'bell-descent':[['서술','거대한 청동 입술이 천천히 내려와 받침돌에 멎었다. 종은 깨지지 않았다. 그 아래에는 사람이 돌아 나올 길이 남았다.'],['소단','이제 틈을 잡을 수 있어요. 안에 남은 혼부터 나눌게요.']]
}});
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){return b?.honroStage===18&&!b.honroBellRevision?legacy:contentFor(b,st);};
const memory=b=>(b.honroState.bellDescent??={version:1,status:'suspended',offset:0,count:0,warnings:{},entries:{},opportunities:{}});
const done=(b,id)=>!!A.memory(b).done[id];
function satisfied(b,s){return active(b)&&s.kind==='bell-descent'?memory(b).status==='settled':null;}
const alive=u=>!u.dead&&u.hp>0;
const intersects=(a,z)=>a.x+a.w>z.x&&a.x<z.x+z.w&&a.y+a.h>z.y&&a.y<z.y+z.h;
function occupants(b){const sweep=b.honroBellDescent?.sweep||[],out=[];
 for(const u of b.units)if(alive(u)&&sweep.some(z=>intersects({x:u.x-u.r-8,y:u.y-u.h-8,w:u.r*2+16,h:u.h+16},z)))out.push({kind:u.summoned?'summon':u.side===0?'hero':u.honroProtected?'resident':'enemy',id:u.id,label:u.name||u.id,x:u.x,y:u.y});
 for(const s of b.stakes||[])if(s.active!==false&&(!Number.isFinite(s.expires)||s.expires>b.round)&&sweep.some(z=>intersects({x:s.x-24,y:s.y-74,w:48,h:80},z)))out.push({kind:'stake',id:s.id,label:'진목',x:s.x,y:s.y});
 for(const p of b.projectiles||[])if(sweep.some(z=>intersects({x:p.x-(p.radius||6),y:p.y-(p.radius||6),w:(p.radius||6)*2,h:(p.radius||6)*2},z)))out.push({kind:'projectile',id:p.id,label:'날아가는 탄',x:p.x,y:p.y});
 return out;
}
function safeBoundary(app){const e=app.engine,b=e.b;return !!app.actorBoundary&&!app.dialogue&&!['flight','review','summon','won','lost'].includes(b.phase)&&!b.projectiles.length&&!b.volley&&!b.summonTurn&&!b.units.some(u=>u.meleeAction||u.meleeFollow==='ready')&&!e.settleBusy();}
function shift(b,offset){const m=memory(b),delta=offset-(m.offset||0);if(Math.abs(delta)<1e-9)return;const spec=b.honroBellDescent||{},ids=new Set(spec.terrainIds||[]);
 for(const list of [b.terrain,b.honroWorldTerrain])for(const t of list||[])if(ids.has(t.id)){t.y+=delta;t.vertices=t.vertices?.map(p=>({...p,y:p.y+delta}));}
 const elements=new Set(spec.elementIds||[]);
 for(const list of [b.honroEnvironment?.placements,b.honroLandmarks,b.honroElements])for(const p of list||[])if(elements.has(p.id))p.y+=delta;
 m.offset=offset;b.sceneVersion=(b.sceneVersion||0)+1;
}
function settle(app){const b=app.engine.b,m=memory(b),spec=b.honroBellDescent;
 shift(b,spec.distance);m.status='settled';m.count=1;m.completedSerial=b.honroState.actorTurnSerial||0;m.completedRound=b.round;m.blockers=[];m.reason='';
 for(const id of spec.openTerrainIds||[]){for(const list of [b.terrain,b.honroWorldTerrain]){const t=list?.find(t=>t.id===id);if(t)t.broken=true;}}
 // These named fixed links are authored in both maps; no actor is carried.
 b.sceneVersion++;app.dirty=true;app.event('대종이 받침에 멎었다. 아래 귀환길과 동쪽 측면길이 열려 있다.');
 if(m.camera&&app.scene?.storyRelease)app.scene.storyRelease(m.camera,350);
 app.engine.emit?.('save');
}
function transition(app){const e=app.engine,b=e.b,m=memory(b);if(!b.honroBellDescent||m.status==='settled'||m.status==='lowering')return;
 const hold=A.steps(b).find(s=>s.id==='hold-silence'),anchor=b.terrain.find(t=>t.id==='upper-chain');
 if(!done(b,'silence')||!hold||!A.satisfied(b,hold)||!anchor?.broken)return;
 const serial=b.honroState.actorTurnSerial||0;
 if(m.status==='suspended'){
  m.status='warning';m.warnedSerial=serial;m.warnedRound=b.round;m.opportunities={};m.warnedHeroes=e.heroesAlive().filter(u=>!u.summoned&&!u.enthrall).map(u=>u.id);
  m.reason='각 동행이 경고 뒤 한 번 움직이거나 행동을 마치면 안전을 확인합니다.';
  app.event('사슬의 장력이 풀린다. 종 가장자리의 황토빛 쓸림면을 비우세요. 아래 푸른 바닥과 양쪽 귀환길은 안전합니다. 각 동행에게 이동 기회가 남습니다.');app.dirty=true;return;
 }
 if(app.actorBoundary&&serial>m.warnedSerial&&m.warnedHeroes.includes(app.actorBoundary))m.opportunities[app.actorBoundary]=serial;
 const waiting=m.warnedHeroes.filter(id=>{const u=e.unit(id);return u&&alive(u)&&!m.opportunities[id];});
 const blocks=occupants(b);m.blockers=blocks;
 const reason=waiting.length?'이동 기회 대기 · '+waiting.map(id=>e.unit(id)?.name||id).join('·'):blocks.length?'하강 대기 · '+[...new Set(blocks.map(v=>v.label))].join('·')+' · 아래 바닥이나 양쪽 귀환길로 이동하세요':'쓸림면이 비었습니다. 다음 안전한 행동 종료에 내려앉습니다.';
 if(m.reason!==reason){m.reason=reason;app.dirty=true;}
 m.status=waiting.length?'warning':'waiting';
 if(waiting.length||blocks.length||!safeBoundary(app))return;
 m.status='lowering';m.elapsed=0;m.duration=.9;m.startOffset=m.offset||0;m.reason='대종이 받침에 내려앉는 중';app.dirty=true;
 if(app.scene?.storyFocusPoint){m.camera={x:app.scene.x,y:app.scene.y,scale:app.scene.scale,manual:app.scene.manual};const at=b.honroBellDescent.resting||{};app.scene.storyFocusPoint(at.x||7200,(at.y||7000)-400,180,.32);}
 app.event('청동 입술이 받침돌을 향해 천천히 내려온다.');e.emit?.('save');
}
function entryFor(b,source){const spec=b.honroBellDescent?.entries||{},index=source==='keeper-retaliation'?0:Math.floor(Number(source.split('-').at(-1))/3);const list=source==='keeper-retaliation'?spec.keeper:spec.hold;return list?.[index%(list?.length||1)];}
function warnWave(app,source){const b=app.engine.b,m=memory(b);if(m.warnings[source]||!entryFor(b,source))return;m.warnings[source]={serial:b.honroState.actorTurnSerial||0,round:b.round};
 app.event(source==='keeper-retaliation'?'동쪽 정비문에서 곡괭이 넷이 들린다. 다음 행동 뒤 들어올 마지막 보복조다.':entryFor(b,source).side==='west'?'서쪽 암틈에서 종울림이 모인다. 다음 행동 뒤 억제진으로 들어온다.':'종입술 바깥에서 잔울림이 엉긴다. 다음 행동 뒤 들어올 틈을 살피세요.');app.dirty=true;
}
function prepareWaves(app){const b=app.engine.b,a=A.memory(b),hold=A.steps(b).find(s=>s.id==='hold-silence'),h=a.holds?.['hold-silence'];
 if(done(b,'silence')&&!done(b,'hold-silence')&&(h?.spawned||0)<(hold?.wave?.count||0)&&h?.waveRound!==b.round)warnWave(app,'hold-silence-'+(h?.spawned||0));
 const boss=app.engine.unit('act2-keeper');if(boss&&boss.hp<=boss.maxHp*.6&&!a.events['keeper-retaliation'])warnWave(app,'keeper-retaliation');
}
const execute=W.execute;
W.execute=function(app,action){const b=app.engine?.b,source=action?.source;
 if(!active(b)||action?.type!=='spawn'||!(source==='keeper-retaliation'||/^hold-silence-(0|3|6)$/.test(source||'')))return execute(app,action);
 const mem=memory(b),warning=mem.warnings[source],entry=entryFor(b,source);if(!entry||!warning||(b.honroState.actorTurnSerial||0)<=warning.serial)return false;
 const n=action.n||1,choices=[entry,...(entry.alternates||[]).map(p=>({...p,side:entry.side}))],flying=!!G.HonroWorld.archetypes[action.kind]?.flying;
 const at=choices.find(p=>!b.units.some(u=>alive(u)&&u.side!==1&&Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*110).some(x=>Math.abs(u.x-x)<u.r+220)&&Math.abs(u.y-(p.y-(flying?255:0)))<330));if(!at)return false;
 const previous=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:at.x,y:at.y,support:at.surfaceId||at.support,spacing:110,maxDistance:260});if(result===false)return false;
 for(const u of b.units)if(u.side===1&&!previous.has(u.id)){
  if(u.elite){u.combatBaseHp/=1.25;u.hp=u.maxHp=Math.round(u.combatBaseHp*C.DIFFICULTIES[b.difficulty].hp);u.honroXpWeight/=1.25;}u.elite=false;u.armor=.04;u.honroBellEntry=at.side;
 }
 mem.entries[source]={side:at.side,x:at.x,y:at.y,round:b.round,serial:b.honroState.actorTurnSerial||0};return result;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)?Math.max(cap(b),b.honroBellPopulationCap||53):cap(b);};
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e),b=e.b;if(!active(b)||e.honroBellAttached)return out;e.honroBellAttached=true;memory(b);
 const recover=e.recover.bind(e);e.recover=function(u){const out=recover(u);A.subdue(e,u);return out;};
 const can=e.canAct.bind(e);e.canAct=function(){return memory(e.b).status!=='lowering'&&can();};
 const tick=e.tick.bind(e);e.tick=function(dt){const m=memory(e.b);if(m.status!=='lowering')return tick(dt);
  m.elapsed=Math.min(m.duration||.9,(m.elapsed||0)+Math.max(0,dt));const t=m.elapsed/(m.duration||.9),ease=t*t*(3-2*t);shift(e.b,(m.startOffset||0)+(e.b.honroBellDescent.distance-(m.startOffset||0))*ease);app.dirty=true;
  if(t>=1)settle(app);
 };
 const refresh=e.refreshActivation.bind(e);e.refreshActivation=function(){refresh();const heroes=e.heroesAlive(),mem=memory(b);mem.alert??={};for(const [cell,radius]of Object.entries(b.honroBellActivation||{})){const units=e.alive(1).filter(u=>u.honroBellCell===cell);if(!units.length)continue;const alert=mem.alert[cell]||units.some(u=>u.aggroUntil>=b.round||heroes.some(h=>Math.hypot(h.x-u.x,(h.y-u.y)*.8)<radius));if(alert)mem.alert[cell]=true;else for(const u of units)u.awake=false;}};e.refreshActivation();return out;
};
const tick=A.tick;A.tick=function(app,dt){const b=app.engine?.b;if(!active(b))return tick(app,dt);if(memory(b).status==='lowering')return;
 app.engine.refreshActivation();prepareWaves(app);transition(app);if(memory(b).status==='lowering')return;const out=tick(app,dt);transition(app);return out;
};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const a=A.memory(b),m=memory(b),hold=A.steps(b).find(s=>s.id==='hold-silence'),anchor=b.terrain.find(t=>t.id==='upper-chain');
 if(done(b,'silence')&&(!A.satisfied(b,hold)||!anchor?.broken)){
  const h=a.holds?.['hold-silence'],site=b.honroMarkers.find(s=>s.id==='hold-silence');out.summary=`${A.steps(b).filter(s=>A.satisfied(b,s)).length}/8 · 병렬 안정화 · 억제 ${h?.progress||0}/4라운드${h?.contested?' (적 점유)':''} · 고정구 ${anchor?.broken?'해제':'남음'}`;
  out.targets=[...(!A.satisfied(b,hold)&&site?[{id:'hold-silence',kind:'interact',x:site.x,y:site.y,label:'담허 · 억제진 4라운드'}]:[]),...(!anchor?.broken&&anchor?[{id:'upper-chain',kind:'seal',x:anchor.x+anchor.w/2,y:anchor.y,label:'장력 고정구 · 기본 공격',box:anchor}]:[])];
 }
 if(['warning','waiting','lowering'].includes(m.status)){out.summary='4/8 · '+m.reason;out.targets=[{id:'bell-descent',kind:'interact',x:b.honroBellDescent.resting?.x||7200,y:b.honroBellDescent.resting?.y||7100,label:m.reason}];}
 return out;
};
G.HonroStage18Bell={active,memory,steps,legacy,satisfied,occupants,safeBoundary,transition,shift,entryFor,prepareWaves};
})(globalThis);
