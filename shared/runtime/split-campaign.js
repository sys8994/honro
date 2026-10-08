(function(G){'use strict';
const C=G.HONRO_CORE,clone=x=>structuredClone(x),VERSION=2,ALL=['archer','mage','knight','occultist'];
const roster=(id,version=VERSION)=>version===1?(id===25?['knight','mage']:id===26?['archer','occultist']:[...ALL]):id===25||id===27?['archer','mage']:id===26?['knight','occultist']:[...ALL];
const last=s=>s?.version===1?27:28;
const legacy=(profile,id)=>profile?.honroSplitCampaign?.version===1&&!profile.honroSplitCampaign.finished&&[25,26,27].includes(id);
const content=(profile,id)=>legacy(profile,id)?G.HONRO_SPLIT_V1?.content.find(s=>s.id===id):null;
const hero=u=>u.side===0&&!u.summoned&&!u.enthrall&&ALL.includes(u.cls);
const active=b=>!!b&&!b.honroCustom&&[1,VERSION].includes(b.honroSplit?.version)&&b.honroStage>=24&&b.honroStage<=last(b.honroSplit);
const fields=['shield','bound','mark','markSide','breaks','stun','curseTurns','curseDamage','curseAttack','curseArmor','curseOwner','lastStandUsed','healUsed','nextSummonDiscount','soulRemnants','jucheon','jucheonReady','swordChain','harmony','bladeStored','soulAffinityBonus','soulDefenseBonus','manifested','revealSpiritToParty','formDamageTakenBonus'];
const clocks=['stunUntil','betrayalUntil','manifestedUntil','soulBonusUntil'];
const nested={prepared:'expires',slowed:'expires',earthbind:'until',martialGuard:'round',bladeScreen:'round'};
function snapshot(b,u){
 const s={hp:u.hp,maxHp:u.maxHp,focus:u.focus,maxFocus:u.maxFocus,dead:!!u.dead||u.hp<=0,status:{},cooldowns:{}};
 for(const key of fields)if(u[key]!==undefined)s.status[key]=clone(u[key]);
 for(const key of clocks)if(u[key]>=b.round)s.status[key]=u[key]-b.round;
 for(const [key,clock] of Object.entries(nested))if(u[key]?.[clock]>=b.round)s.status[key]={...clone(u[key]),[clock]:u[key][clock]-b.round};
 if(u.shieldUntil!==undefined)s.shieldTurns=Math.max(0,u.shieldUntil-(b.teamEnds?.[1]||0));
 if((u.curseTurns||0)>0&&u.curseDamage>0)s.detachedCurse=true;
 if(u.earthbind)s.detachedEarth=true;
 for(const [id,end] of Object.entries(u.cooldowns||{}))if(end>b.round)s.cooldowns[id]=end-b.round;
 return s;
}
function restore(b,u,s){
 if(!s)return;
 // A maximum-stat increase is paid once against the saved maximum; damage and
 // spent MP survive it. Never resurrect an unconscious actor via applyHero.
 u.dead=!!s.dead||s.hp<=0;u.hp=u.dead?0:Math.min(u.maxHp,Math.max(0,s.hp+Math.max(0,u.maxHp-s.maxHp)));
 u.focus=Math.min(u.maxFocus,Math.max(0,s.focus+Math.max(0,u.maxFocus-s.maxFocus)));
 for(const key of [...fields,...clocks,...Object.keys(nested)])delete u[key];
 Object.assign(u,clone(s.status||{}));
 for(const key of clocks)if(s.status?.[key]!==undefined)u[key]=b.round+s.status[key];
 for(const [key,clock] of Object.entries(nested))if(u[key])u[key][clock]+=b.round;
 u.shield??=0;u.bound??=0;u.mark??=0;u.breaks??=0;
 if(s.shieldTurns!==undefined)u.shieldUntil=(b.teamEnds?.[1]||0)+s.shieldTurns;
 if(s.detachedCurse){delete u.curseOwner;u.honroCarriedCurse=true;}
 if(s.detachedEarth&&u.earthbind){u.earthbind.owner='';u.honroCarriedEarth=true;}
 u.cooldowns=Object.fromEntries(Object.entries(s.cooldowns||{}).map(([key,left])=>[key,b.round+left]));
}
function prepare(profile,id){
 if(id<24||id>28)return null;
 const old=profile.honroSplitCampaign;
 if([1,VERSION].includes(old?.version)&&!old.finished&&(old.nextStage===id||old.stage===id))return clone(old);
 return {version:VERSION,mode:id===24?'continuous':'replay',stage:id,activeRoster:roster(id),vitals:{},starts:{},completed:{},items:null,nextStage:null,finished:false};
}
function initialize(b,profile){
 if(b.honroCustom||b.honroStage<24||b.honroStage>28)return;
 if(b.honroStage===28&&profile.honroSplitCampaign?.version===1&&profile.honroSplitCampaign.finished)return;
 const id=b.honroStage,s=prepare(profile,id);s.stage=id;s.activeRoster=roster(id,s.version);s.nextStage=null;s.finished=false;
 for(const key of Object.keys(s.completed))if(Number(key)>=id)delete s.completed[key];
 for(const key of Object.keys(s.starts))if(Number(key)>id)delete s.starts[key];
 b.honroSplit=s;b.activeRoster=[...s.activeRoster];
 b.units=b.units.filter(u=>!hero(u)||s.activeRoster.includes(u.cls));
 // Replay-only entry has no invented history for the absent team. Only real
 // snapshots collected since an explicit chapter-24 start are continuous proof.
 const start=s.starts[id];if(start){s.vitals=clone(start.vitals);s.items=clone(start.items);}
 if(s.items)b.items=clone(s.items);
 for(const u of b.units.filter(hero)){
  restore(b,u,s.vitals[u.cls]);
  if(id===last(s)){const p=b.honroMapAnchors?.splitSpawns?.[u.cls];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))Object.assign(u,{x:p.x,y:p.y,spawnX:p.x,spawnY:p.y});}
 }
 if(id===last(s))s.spawnReady=ALL.every(cls=>{const p=b.honroMapAnchors?.splitSpawns?.[cls];return Number.isFinite(p?.x)&&Number.isFinite(p?.y);});
 capture(b);s.starts[id]??={vitals:clone(s.vitals),items:clone(b.items)};
 b.active=b.units.find(u=>hero(u)&&!u.dead)?.id||b.units.find(hero)?.id||b.active;
}
function capture(b){if(!active(b))return;for(const u of b.units.filter(hero))b.honroSplit.vitals[u.cls]=snapshot(b,u);b.honroSplit.items=clone(b.items);}
function persist(app){const b=app.engine?.b;if(!active(b)||app.training||app.customMap)return;capture(b);app.profile.honroSplitCampaign=clone(b.honroSplit);if(app.profile.honroBattle?.session===b.session)app.profile.honroBattle.honroSplit=clone(b.honroSplit);}
function outcome(app,won){const b=app.engine?.b;if(!active(b))return;const s=b.honroSplit;
 // Clear rewards can grow maximum stats even though the core clear path only
 // updates HeroProgress. Apply just the earned delta before checkpointing.
 if(won)for(const u of b.units.filter(hero))C.applyHero(u,b.heroes[u.cls]);
 capture(b);if(won){s.completed[b.honroStage]=true;s.nextStage=b.honroStage<last(s)?b.honroStage+1:null;s.finished=b.honroStage===last(s);}else s.nextStage=b.honroStage;
 app.profile.honroSplitCampaign=clone(s);
}
// A carried curse must not disappear with its former map's caster, nor bind
// to an unrelated next-map enemy that reuses the same unit ID. The ordinary
// newRound still owns duration decrement and MP regeneration exactly once.
function attach(app,e){if(!active(e.b)||e.honroSplitAttached)return;e.honroSplitAttached=true;
 const next=e.newRound.bind(e);e.newRound=function(){
  for(const u of e.b.units.filter(hero))if(!u.dead){
   if(u.honroCarriedCurse&&!u.curseOwner&&(u.curseTurns||0)>0&&u.curseDamage>0)e.hurt(u,u.curseDamage,'',false);
   if(u.honroCarriedEarth&&u.earthbind&&!u.earthbind.owner&&u.earthbind.until>=e.b.round+1){u.slowed={factor:.24,expires:e.b.round+1};e.hurt(u,u.earthbind.damage,'',false,undefined,undefined,'normal','O10');}
  }
  return next();
 };
}
function allPresent(b){return active(b)&&b.honroSplit.activeRoster.every(cls=>b.units.filter(u=>hero(u)&&u.cls===cls&&!u.dead&&u.hp>0).length===1);}
function failure(b){if(!active(b)||b.honroStage===last(b.honroSplit)||G.HonroStakeCrossing?.active(b))return null;return allPresent(b)?null:'조사팀 동행이 쓰러졌다. 현재 장의 시작 상태에서 다시 걷자.';}
function locked(profile){const s=profile.honroSplitCampaign;return [1,VERSION].includes(s?.version)&&!s.finished&&(s.stage>=25||s.nextStage===25);}
function redirectRest(app){
 if(app.debugMode)return false;
 // The custom map has a temporary profile. Check its protected owner before
 // offering rest/camp, then resume that owner's saved expedition unchanged.
 if(app.customMap){if(!locked(app.customMap.returnProfile))return false;app.stopBattle();}
 if(app.training||!locked(app.profile))return false;
 const s=app.profile.honroSplitCampaign;
 if(active(app.engine?.b)&&!app.done){app.close();return true;}
 if(app.profile.honroBattle&&active(app.profile.honroBattle)){app.continue();return true;}
 app.engine=null;app.launch(s.nextStage||s.stage);return true;
}
function allowLaunch(app,id,training){if(app.debugMode)return true;const owner=app.customMap?.returnProfile||app.profile;if(!locked(owner))return true;const s=owner.honroSplitCampaign;if(!training&&(id===s.stage||id===s.nextStage))return true;app.notify('두 조사팀은 쉬지 않고 합류합니다. 현재 장을 이어가거나 다시 걸어주세요.');return false;}
// Explicit QA chapter replacement discards only the temporary expedition's
// carry chain. The normal profile remains owned by App.normalProfile; ordinary
// result-continue and same-chapter retries still use their real checkpoints.
function prepareLaunch(app,id,training){const s=app.profile.honroSplitCampaign;if(app.debugMode&&!training&&locked(app.profile)&&id!==s.stage&&id!==s.nextStage)delete app.profile.honroSplitCampaign;}
function resultLabel(app){const b=app.engine?.b;if(!active(b)||b.honroSplit.finished)return null;return b.phase==='lost'?'현재 조사 다시 걷기':b.honroStage===24?'지하 수로로':b.honroStage===25?'공방 조사 이어가기':b.honroStage===26?'수로 심부로':'두 조사팀 합류하기';}
function resultContinue(app){const b=app.engine?.b;if(!app.done||!active(b)||b.honroSplit.finished)return false;const id=b.honroSplit.nextStage||b.honroStage;app.engine=null;app.profile.honroBattle=null;app.close();app.launch(id);return true;}
G.HonroSplitCampaign={version:VERSION,roster,hero,active,prepare,initialize,attach,capture,persist,outcome,allPresent,failure,locked,redirectRest,allowLaunch,prepareLaunch,resultLabel,resultContinue,snapshot,restore,legacy,content};
})(globalThis);
