(function(G){'use strict';
const REVISION=1;
const species={
 geuseundae:['그슨대','가까운 동행 앞에서 부푼다 · 헛손질 뒤 작아진다'],
 dokkaebibul:['도깨비불','가까운 불씨끼리 합체하려 든다 · 준비 중에 끊을 수 있다'],
 eoduksini:['어둑시니','살아남으면 커지고 공격받지 않은 라운드에 작아진다'],
 sonmalmyeong:['손말명','매듭을 옮기려 한다 · 동행 사이 간격을 벌리면 끊긴다'],
 gaekgwi:['객귀','동행의 어깨를 노린다 · 동료가 객귀를 직접 공격하거나 붙잡힌 동행의 행동이 끝나면 풀린다'],
 dueoksini:['두억시니','두 팔로 표시된 바닥을 내리치고 잠시 빈틈을 보인다'],
 yagwanggwi:['야광귀','표시한 동행에게서 물건을 노리고 달아난다'],
 mulgwishin:['물귀신','수면이 가까우면 손을 뻗는다 · 마른 지면으로 물러서면 닿지 않는다'],
 geuseunsae:['그슨새','직전에 사용한 기예 하나를 잠시 노린다'],
 muyeo:['점복무녀','동행을 지목하고 동료를 유도한다 · 준비 중 직접 공격으로 끊을 수 있다'],
};
const archetypes={
 vanguard:['봉쇄 전위','방패를 들고 직선으로 돌진한다 · 돌진 뒤 측면을 노린다'],
 marksman:['지휘 사수','발판을 예고 사격한다 · 다음 자리를 잡는 동안 빈틈이 생긴다'],
 device:['강화 사물','작동 범위를 예고하고 공격 뒤 재장전한다'],
 pursuer:['추격체','정해진 길로 뛰어든다 · 미리 피하면 착지 뒤 빈틈이 생긴다'],
};
// Existing unit id, original kind, role, optional display name and encounter.
// A changed source kind skips the override instead of picking an unrelated foe.
const placements={
 3:[['midboss-stage3','warden','naruWarden']],
 4:[['foe-0-cluster','hound','geuseundae']],
 5:[['s5-entry-hound','hound','muyeo']],
 6:[['midboss-stage6','warden','bridgeWarden']],
 8:[['s8-17','lantern','bierRepair','시종 꼭두']],
 9:[['foe-11','ghost','dokkaebibul',null,'well-fires'],['foe-11-cluster','ghost','dokkaebibul',null,'well-fires'],['foe-9','hound','dokkaebibul',null,'well-fires']],
 10:[['boss','human','sodanOmen']],
 12:[['sq-b2','picks','eoduksini']],
 13:[['a2-enemy-19','picks','device','석문 곡괭이']],
 15:[['a2-enemy-3','waterwheel','device','배수로 수차']],
 16:[['tm-hall-echo','monkVessel','sonmalmyeong']],
 17:[['ws-service-captain','stoneLantern','device','인양로 석등']],
 21:[['a3-21-gate-watch-1','possessedGuard','vanguard','성문 봉쇄 전위']],
 22:[['v22-a3','possessedGuard','dueoksini'],['v22-f5','possessedArcher','marksman','문서고 지휘 사수']],
 23:[['s23-A-1','possessedGuard','vanguard','하역 경비 전위']],
 24:[['a3-24-abandoned-garden-watch-3','archiveFiend','gaekgwi']],
 28:[['a3-28-west-record-veranda-3','possessedArcher','yagwanggwi']],
 30:[['sf-e1','possessedGuard','vanguard','승선로 봉쇄 전위']],
 33:[['a4-33-c-4','possessedArcher','mulgwishin'],['a4-33-h-3','warden','marksman']],
 35:[['a4-35-r-2','shade','geuseunsae'],['a4-35-c-2','warden','marksman']],
 37:[['a4-37-c-3','warden','vanguard']],
 38:[['a4-38-e-1','warden','pursuer']],
};
const preserved=new Set([19,31,34,36,39,40]);
const kinds={
 boar:'boar',stag:'stag',shade:'HSH02',warden:'HWD02',mourner:'mourner',lantern:'lantern',
 picks:'pick',minecart:'cart',resonance:'resonance',possessedGuard:'shield',
};
const strong=new Set(['stag','HSH02','HWD02','mulgwishin','sonmalmyeong','gaekgwi','geuseunsae','naruWarden','bridgeWarden','vanguard','pursuer']);
const variants=['giant','burning','cursed','hungry','captain'];

function kind(u){return u.honroVariant||u.honroType;}
function enemy(u){return u.side===1&&!u.dead&&!u.honroObjectiveTarget&&!u.honroAct5Reserve;}
function bespoke(u){return u.honroAct2Boss||u.honroStage29Boss||u.honroPilotMidboss||u.honroPilotCombatBudget||u.honroAct4WreckBoss||u.honroAct4FinaleBoss||u.honroAct4RewardTag;}
function near(a,c){
 if(a.honroCluster&&a.honroCluster===c.honroCluster)return true;
 return Math.abs(a.x-c.x)<660&&Math.abs(a.y-c.y)<280;
}
function onSafeGround(b,u){
 const span=[u.x-150,u.x,u.x+150];
 if(span[0]<0||span[2]>b.width)return false;
 const tide=b.honroAct4Design?.tide;
 if(tide&&u.y>tide.high-260)return false;
 const supports=span.map(x=>G.HonroMapEngine.surfaceY(b.terrain,x,u.y));
 return supports.every(hit=>hit&&Math.abs(hit.y-u.y)<=70);
}
function currentPattern(u){return u.honroMonsterPattern||u.honroMonsterEffectSkill;}
function rule(b,u,peers){
 if(!enemy(u)||bespoke(u)||u.boss||u.honroMidboss||u.honroFinalBoss||currentPattern(u))return;
 const base=kind(u),pattern=base==='possessedArcher'&&u.elite?'sniper':kinds[base];
 if(!pattern||u.id.startsWith('resident-spirit')||base==='warden'&&!onSafeGround(b,u))return;
 if(strong.has(pattern)&&peers.some(v=>v!==u&&enemy(v)&&near(u,v)&&strong.has(currentPattern(v))))return;
 if(pattern==='HSH02'||pattern==='HWD02'){
  if(!u.loadout?.includes(pattern))return;
  u.honroMonsterEffectSkill=pattern;
  b.honroMonsterEffectsRevision=1;
 }else u.honroMonsterPattern=pattern;
}
function install(b,u,row){
 const [id,base,pattern,label,cluster]=row;
 if(!u||u.id!==id||!enemy(u)||kind(u)!==base||bespoke(u))return;
 const identity=species[pattern]||archetypes[pattern];
 u.honroMonsterPattern=pattern;
 if(identity){
  u.honroMonsterSpecies=pattern;
  u.intent=identity[1];
  if(archetypes[pattern])u.honroMonsterArchetype=pattern;
 }
 if(label||species[pattern])u.name=label||identity[0];
 if(cluster)u.honroMonsterGroup=cluster;
}
function canDemote(b,u){
 const n=b.honroStage;
 // Act 2/3 explicitly record promotion and its multiplier. The other acts
 // have bespoke elite grant, damage and story contracts.
 if(n>=12&&n<=17||n===20)return u.honroAct2Elite===true&&u.honroAct2Tuned===true;
 return n>=22&&n<=30&&n!==23&&u.honroAct3Elite===true&&u.honroAct3EncounterTuned===true;
}
function variantHash(s){let hash=0;for(const ch of s)hash=(Math.imul(31,hash)+ch.charCodeAt(0))|0;return hash>>>0;}
function decorateElites(b,units){
 const candidates=units.filter(u=>u.elite&&!bespoke(u)&&!u.boss&&!u.honroMidboss&&!u.honroFinalBoss&&!u.honroMonsterSpecies&&u.honroType!=='hoist'&&kind(u)!=='monkVessel');
 const spared=[];
 for(const u of candidates){
  if(canDemote(b,u)&&spared.length>=3){
   // Keep the spawn slot and reward allocation. Undo only the known generic
   // elite HP/attack/armor bonus on this already-scaled full-health unit.
   u.elite=false;
   u.honroMonsterFormerElite=true;
   u.hp=u.maxHp=Math.max(1,Math.round(u.maxHp/1.55));
   u.combatBaseHp/=1.55;
   u.attack/=1.15;
   u.combatBaseAttack/=1.15;
   if(u.armor===.12)u.armor=.04;
   u.name=u.name.replace(/^정예 /,'');
   continue;
  }
  spared.push(u);
  const first=variantHash(u.id)%variants.length;
  u.honroMonsterVariant=variants[(first+spared.length)%variants.length];
 }
}
function prepareFresh(b){
 if(G.HONRO_MONSTER_REWORK_DISABLED===true||!b?.honroCanonical||b.honroCustom||b.honroMonsterReworkRevision||b.honroStage<1||b.honroStage>40||preserved.has(b.honroStage))return false;
 const units=b.units.filter(enemy);
 if(!units.length)return false;
 b.honroMonsterReworkRevision=REVISION;
 for(const row of placements[b.honroStage]||[])install(b,units.find(u=>u.id===row[0]),row);
 // Reserve the already-released pilots before choosing nearby control.
 const pilot=b.honroStage===5?['s5-cave-shade','HSH02']:b.honroStage===8?['s8-15','HWD02']:null;
 if(pilot){const owner=units.find(u=>u.id===pilot[0]);if(owner?.loadout?.includes(pilot[1])){b.honroMonsterEffectsRevision=1;owner.honroMonsterEffectSkill=pilot[1];}}
 decorateElites(b,units);
 for(const u of units)rule(b,u,units);
 return true;
}
function prepareSpawn(b,u){
 if(b?.honroMonsterReworkRevision===REVISION)rule(b,u,b.units);
}
G.HonroMonsterRoster={prepareFresh,prepareSpawn};
})(globalThis);
