(function(G){'use strict';
// Only newly authored quarry snapshots opt in. Saved old battles retain their
// own geography, actors, steps, story payload and combat numbers.
const A=G.HonroAct2,W=G.HonroAllies,E=G.HonroEncounters,C=G.HONRO_CORE;
const clone=v=>JSON.parse(JSON.stringify(v)),active=b=>b?.honroStage===12&&!b.honroCustom&&b.honroQuarryRevision===1;
const alive=u=>!!u&&!u.dead&&u.hp>0,hero=u=>alive(u)&&u.side===0&&!u.summoned&&!u.enthrall;
const sources=['hold-road-0','hold-road-3','hold-road-6'];
const memory=b=>(b.honroState.quarry??={version:1,gate:'closed',openCount:0,warnings:{},entries:{}});
const serial=b=>b.honroState.actorTurnSerial||0;
const paused=app=>!!app.dialogue||!!app.modal?.classList.contains('open')||!!app.charging||!!G.HonroStory?.turnPaused?.(app);
const ended=app=>app.done||['won','lost'].includes(app.engine.b.phase);
const safe=app=>!ended(app)&&!paused(app)&&!['flight','review','summon','ally'].includes(app.engine.b.phase)&&!(app.engine.b.projectiles||[]).length&&!app.engine.b.volley&&!app.engine.b.summonTurn&&!app.engine.b.units.some(u=>alive(u)&&(u.meleeAction||u.meleeFollow==='ready'))&&!app.engine.settleBusy();
const factory=G.HonroWorld.createEnemy;
G.HonroWorld.createEnemy=function(b,st,...args){const u=factory(b,st,...args);if(!active(b))return u;
 // World factory's index%11 elite is historical, not an authored quarry role.
 // Re-run its base tuning with elite=false, rather than leave invisible HP/XP.
 u.elite=false;u.armor=.04;G.HonroProgression.tuneEnemy(st,u,args[1]);G.HonroProgression.enemyXP(b,u);u.honroQuarryBase=true;return u;
};
const initialize=G.HonroProgression.initialize;
G.HonroProgression.initialize=function(b,profile){if(!active(b))return initialize(b,profile);
 // Fresh creation only. Final authored elite weights and all eight finite
 // minecarts share the unchanged chapter combat ceiling. Continue never calls
 // this path or rewrites xpGranted/ledger/remaining resources.
 for(const u of b.units)if(u.side===1)A.tuneEncounter(u,12);
 const out=initialize(b,profile);if(b.honroGrowth){const reserve=8+2*.6;b.honroGrowth.weight+=reserve;b.honroGrowth.quarryWaveWeight=reserve;b.honroGrowth.quarryRevision=1;for(const u of b.units)if(u.side===1)G.HonroProgression.enemyXP(b,u);}return out;
};
const contentFor=G.HonroObjectiveRevision.contentFor;
G.HonroObjectiveRevision.contentFor=function(b,st){if(!active(b)||!b.honroQuarryContent)return contentFor(b,st);const out=clone(b.honroQuarryContent),m=b.honroState?.quarry;if(m?.signLines)out.beats.sign=clone(m.signLines);return out;};
const entry=A.entry;A.entry=function(app,options={}){if(!active(app.engine?.b))return entry(app,options);const stage=G.HonroObjectiveRevision.contentFor(app.engine.b,app.stage);return entry({...app,stage},options);};
const near=(u,p,r=300)=>hero(u)&&!!p&&Math.hypot(u.x-p.x,u.y-p.y)<r&&Math.abs(u.y-p.y)<150;
const use=A.use;A.use=function(app,marker){const b=app.engine?.b;if(!active(b)||marker?.id!=='sign'||!A.eligibility(app,marker).ok)return use(app,marker);
 const m=memory(b),u=app.engine.active,mage=b.units.find(v=>v.side===0&&v.cls==='mage');
 if(!m.signInteractorId){m.signInteractorId=u?.id;m.signRequestSerial=serial(b);m.signMageNear=near(mage,marker);m.signLines=clone(b.honroQuarryContent.beats.sign);if(!m.signMageNear)for(const line of m.signLines)if(line[0]==='서술')line[1]=line[1].replace('담허가 겹친 획 하나를 풀었다.','담허의 설명을 따라 겹친 획 하나를 풀었다.');}
 m.shoePlaced=true;const out=use(app,marker);if(out&&A.memory(b).done.sign){if(m.gate==='closed')m.gate='waiting';}return out;
};
function gateOccupants(b){const t=b.terrain.find(t=>t.id===b.honroQuarrySpec?.gateTerrainId);if(!t||t.broken)return[];return b.units.filter(u=>alive(u)&&C.terrainRectIntersects(t,u.x-u.r-4,u.y-u.h-4,u.r*2+8,u.h+10,.01));}
function signSceneDone(b){const m=b.honroState?.quarry,hs=b.honroState;if(!m?.signStoryId||b.honroStaging?.once?.[m.signStoryId]!=='done')return false;const sign=line=>line?.[2]?.storyId?.endsWith('act2-12-sign');return !(hs.storyQueue||[]).some(sign)&&!(hs.deferredStory||[]).some(q=>(q.lines||[]).some(sign))&&!(b.honroStory?.lines||[]).some(sign);}
function openGate(app){const b=app.engine.b,m=memory(b);if(m.openCount||!A.memory(b).done.sign||!signSceneDone(b)||serial(b)<=(m.signRequestSerial??-1)||!safe(app)||gateOccupants(b).length)return false;
 const id=b.honroQuarrySpec?.gateTerrainId,lists=[b.terrain,b.honroWorldTerrain];if(!id||lists.some(ts=>!Array.isArray(ts)||ts.filter(t=>t.id===id).length!==1))return false;
 for(const ts of lists)ts.find(t=>t.id===id).broken=true;Object.assign(m,{gate:'open',openCount:1,openedRound:b.round,openedSerial:serial(b)});b.sceneVersion=(b.sceneVersion||0)+1;app.event('길표 뒤의 내리막이 이어졌다. 동굴까지 돌아 나올 수 있다.');app.engine.emit?.('save');app.dirty=true;return true;
}
function prepareWaves(app){const b=app.engine.b;if(!active(b)||ended(app)||paused(app))return;const step=A.current(b),h=A.memory(b).holds?.['hold-road'];if(step?.id!=='hold-road'||(h?.spawned||0)>=8)return;const point=b.honroMarkers.find(p=>p.id==='hold-road');if(!point||!app.engine.heroesAlive().some(u=>Math.hypot(u.x-point.x,u.y-point.y)<step.radius))return;
 const source='hold-road-'+(h?.spawned||0),m=memory(b),at=b.honroQuarrySpec?.entries?.[source];if(!at||m.warnings[source]||m.entries[source])return;m.warnings[source]={serial:serial(b),round:b.round,side:at.side};app.event(at.warning||'바위길에서 수레바퀴가 울린다. 다음 행동 뒤 진입로를 살피세요.');app.dirty=true;
}
const execute=W.execute;W.execute=function(app,action){const b=app.engine?.b,source=action?.source;if(!active(b)||action?.type!=='spawn'||!sources.includes(source))return execute(app,action);
 const m=memory(b),at=b.honroQuarrySpec?.entries?.[source],warning=m.warnings[source];if(m.entries[source])return true;if(!at||!warning||serial(b)<=warning.serial||!app.actorBoundary||!safe(app))return false;
 const key=[serial(b),b.round,...b.teamEnds,app.actorBoundary].join(':'),n=action.n||1;if(b.honroState.lastCombatEventBoundary===key||app.engine.alive(1).length+n>E.populationCap(b))return false;
 for(const p of [at,...(at.alternates||[]).filter(q=>!q.side||q.side===at.side).map(q=>({...q,side:at.side}))]){const spacing=p.spacing??130,support=p.support||p.surfaceId;if(!support||!Array.from({length:n},(_,i)=>p.x+(i-(n-1)/2)*spacing).every(x=>G.HonroMapEngine.surfaceY(b.terrain,x,p.y,support)))continue;
  const before=new Set(b.units.map(u=>u.id)),result=execute(app,{...action,x:p.x,y:p.y,support,spacing,maxDistance:0});if(result===false)continue;let index=0;for(const u of b.units)if(!before.has(u.id)){u.honroQuarryEntry=at.side;u.honroAct2Elite=++index===n&&n>=3;u.honroCohort='reinforcement';u.honroAct2Revision=2;A.tuneEncounter(u,12);G.HonroProgression.enemyXP(b,u);}m.entries[source]={side:at.side,x:p.x,y:p.y,support,count:n,round:b.round,serial:serial(b)};b.honroState.lastCombatEventBoundary=key;app.dirty=true;return result;
 }return false;
};
const cap=E.populationCap;E.populationCap=function(b){return active(b)&&[28,40].includes(b.honroQuarryPopulationCap)?b.honroQuarryPopulationCap:cap(b);};
let directionInstalled=false;
function installDirection(){if(directionInstalled||!G.HonroStoryDirection)return;directionInstalled=true;const build=G.HonroStoryDirection.build;
 G.HonroStoryDirection.build=function(app,lines,options){const out=build(app,lines,options),b=app.engine?.b;if(!active(b)||!lines.some(l=>/(?:^|:)act2-12-(sign|clear-approach)$/.test(l[2]?.storyId||'')))return out;
  const m=memory(b),result=out||{id:'direction-v2:'+lines[0]?.[2]?.storyId,context:{},head:[],cues:lines.map(()=>[])};
  if(lines.some(l=>l[2]?.storyId?.endsWith('act2-12-sign')))m.signStoryId=result.id;
  for(const [i,[who,text,meta]]of lines.entries()){
   if(meta?.storyId?.endsWith('act2-12-sign')&&who==='서술'){result.cues[i]=[];const marker=b.honroMarkers.find(p=>p.id==='sign'),actor=b.units.find(u=>u.id===(text.includes('담허가 겹친')?b.units.find(u=>u.side===0&&u.cls==='mage')?.id:m.signInteractorId));if(near(actor,marker))result.cues[i].push({type:'look',actor:actor.id,at:{marker:'sign'},pose:'inspect',duration:560});result.cues[i].push({type:'look',at:{marker:'sign'},duration:550});}
   if(meta?.storyId?.endsWith('act2-12-clear-approach')&&who==='서술'&&text.includes('짚신')){const marker=b.honroMarkers.find(p=>p.id==='clear-approach'),actor=b.units.find(u=>u.side===0&&u.cls==='archer');result.cues[i]=[{type:'look',at:{marker:'clear-approach'},duration:450},...(near(actor,marker)?[{type:'look',actor:actor.id,pose:'inspect',duration:500}]:[])];}
  }return result;
 };
}
const attach=A.attach;A.attach=function(app,e){const out=attach(app,e);if(!active(e.b)||e.honroQuarryAttached)return out;e.honroQuarryAttached=true;memory(e.b);installDirection();return out;};
const tick=A.tick;A.tick=function(app,dt){if(!active(app.engine?.b))return tick(app,dt);prepareWaves(app);const out=tick(app,dt);if(!ended(app))openGate(app);return out;};
const state=A.state;A.state=function(b){const out=state(b);if(!active(b))return out;const m=b.honroState?.quarry;if(m?.gate==='waiting')out.summary+=' · 길표 뒤 통로가 비워지면 이어집니다';return out;};
G.HonroStage12Quarry={active,memory,sources,safe,near,prepareWaves,gateOccupants,signSceneDone,openGate,installDirection};
})(globalThis);
