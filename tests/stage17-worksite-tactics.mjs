/** Stage 17: real production attacks against unchanged authored opponents.
 * Only each firing hero's starting support pose is initialized. Other actors
 * remain at their authored poses while projectile/martial actions resolve.
 * Normal route traversal, enemy turns, completion and browser QA are separate. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {g,C,stage,sourceIds,entryXp,fixture,fire,aimAt} from './stage17-worksite-tactics-helper.mjs';
const rows=[],hits=(shot,ids)=>ids.filter(id=>(shot.damage[id]||0)>0);
const sourceScene=JSON.stringify(stage),physics=JSON.stringify({skills:C.SKILLS,balances:g.HONRO_BALANCE});
assert.equal(sourceIds.length,36,'Current authored Stage17 roster is present in every isolated fixture');
assert.equal(stage.units.filter(u=>u.team==='enemy'&&u.stageOverrides?.honroAct2Elite).length,8,'Only the eight explicitly authored elites are counted');
assert.equal(stage.design.space.topologyId,'vertical-hoist-shaft-with-switchback-and-gallery');
const example=fixture('archer','ws-west-hoist-deck',5700);
assert.equal(example.hero.level,13,'Use actual Stage17 legacy-campaign entry progression, without bonus levels');
assert.equal(example.profile.heroes.archer.xp,41755);
const attack=(cls,support,x,skill,aim)=>fire(fixture(cls,support,x),skill,aim);

// Facing upper ledges create genuinely long shots in both directions. Every
// arrow uses the free basic skill against the full current airborne roster.
{
 const shots=[
  ['ws-west-hoist-deck',5700,'a2-enemy-11',{angle:-13.654345336202088,power:.7039452137586756}],
  ['ws-east-hoist-deck',6100,'ws-upper-echo',{angle:145.22833075484382,power:.9435347213435725}],
  ['ws-east-fire-deck',7700,'a2-enemy-11',{angle:193.13889792358123,power:.9396619241683556}],
  ['ws-west-hoist-deck',5700,'a2-enemy-10',{angle:111,power:.65}]
 ].map(([support,x,target,aim])=>{
  const q=fixture('archer',support,x),distance=Math.abs(q.e.unit(target).x-x),shot=fire(q,'A01',aim);
  assert(distance>=750,'Crossfire covers a meaningful worksite span');assert.equal(shot.prediction.unit,target);assert(shot.damage[target]>0);assert.equal(shot.contacts.length,0);assert.equal(shot.focusSpent,0);
  return{target,horizontalDistance:distance,...shot};
 });
 assert(shots.some(s=>Math.cos(s.aim.angle*Math.PI/180)>0)&&shots.some(s=>Math.cos(s.aim.angle*Math.PI/180)<0));
 assert.equal(shots[1].damage['a2-enemy-10']||0,0,'The new upper spirit screens the rear bat along the old line');
 rows.push({role:'Seolo: upper long crossfire',screenedRearTarget:'a2-enemy-10',screeningFrontTarget:'ws-upper-echo',shots});console.log('PASS Seolo: upper spirit screens the rear bat; a different upper arc reaches it, with four real 780 / 1240 / 1220 / 1090 range shots');
}

// This is an actual short middle-lane approach, not a second posed attack.
// No movement points are refilled and no opponent is moved or weakened.
{
 const start=6650,support='ws-east-hoist-buttress',target='a2-enemy-9',aim={angle:185,power:1};
 const far=attack('knight',support,start,'S00',aim);assert.equal(far.damage[target]||0,0,'Same slash cannot reach from the approach start');
 const q=fixture('knight',support,start),moveBefore=q.hero.moveLeft,poseBefore={x:q.hero.x,y:q.hero.y};
 for(let frame=0;frame<100&&q.hero.x>6530;frame++)q.e.move(-1,C.STEP);
 const moveSpent=moveBefore-q.hero.moveLeft;assert(q.hero.x<6530&&start-q.hero.x>100);assert(moveSpent>100&&moveSpent<150);assert(q.hero.moveLeft>0);assert(C.validTerrainContactPose(q.b.terrain,q.hero));
 const close=fire(q,'S00',aim);assert(close.damage[target]>0);assert.equal(close.contacts.length,0);assert.deepEqual(close.from.x,close.to.x,'Melee does not teleport the hero');
 rows.push({role:'Hwigyeom: short middle approach and melee',target,poseBefore,moveSpent,far,close});console.log('PASS Hwigyeom: normal middle-lane movement spends 123.33 movement; identical slash changes from out of reach to a real hit');
}

// Role clusters are checked with real multi-target damage and single-arrow
// controls from the same supported position, not merely metadata or counts.
for(const {name,support,x,ids,aim,arrowAim,minimum,alternateAim}of [
 {name:'east axle screened trio',support:'ws-east-hoist-buttress',x:7520,ids:['a2-enemy-15','a2-enemy-16','a2-enemy-17'],aim:{angle:119,power:.5},arrowAim:{angle:123,power:.35},minimum:3},
 {name:'lower carts and raised tool-ledge guard',support:'act2-floor',x:4900,ids:['a2-enemy-8','a2-enemy-7','ws-service-rear'],aim:{angle:174.176222658568,power:.6961729951522418},arrowAim:{angle:177.34679543668338,power:.6758383425265393},minimum:3,alternateAim:{angle:141.29962965003503,power:.6180337008012021}},
 {name:'hoist core and foreman guard',support:'ws-east-hoist-buttress',x:6600,ids:['ws-core-foreman','a2-enemy-9','act2-hoist'],aim:{angle:145,power:.35},minimum:3},
 {name:'upper bat and spirit',support:'ws-east-upper-rock',x:7860,ids:['a2-enemy-12','a2-enemy-18'],aim:{angle:118.06177084232439,power:.8480753266097601},minimum:2}
]){
 const area=attack('mage',support,x,'M04',aim);assert(hits(area,ids).length>=minimum,name+' receives actual multi-enemy damage');
 const arrowFixture=fixture('archer',support,x),singleAim=arrowAim||aimAt(arrowFixture,'A01',ids[0]);assert(singleAim,'A basic arrow alternative exists');
 const single=fire(arrowFixture,'A01',singleAim);assert.equal(hits(single,ids).length,1,'A single arrow does not inherit AoE');
 assert.equal(area.damage['p-mage']||0,0,'The documented attack does not rely on self-damage');
 const verticalSupportSpread=Math.max(...ids.map(id=>stage.design.space.encounterSites.find(s=>s.unitId===id).standing.y))-Math.min(...ids.map(id=>stage.design.space.encounterSites.find(s=>s.unitId===id).standing.y));
 const alternate=alternateAim?attack('mage',support,x,'M04',alternateAim):null;
 if(alternate){assert(verticalSupportSpread>150,'The lower cluster spans actual floor and raised support');assert.equal(hits(alternate,ids).length,1,'Directly targeting the raised guard has a different real area outcome');assert(alternate.damage['ws-service-rear']>0);}
 rows.push({role:'Damheo: clustered area damage',place:name,targets:ids,verticalSupportSpread,blastRadius:C.SKILLS.M04.radius,secondaryReach:260,area,singleTargetControl:single,...(alternate?{upperAimControl:alternate}:{})});
 console.log('PASS Damheo:',name,'takes',hits(area,ids).length,'live hits; basic arrow hits one');
}

// A cast initially passes beneath the floating opponent, hits the actual
// service-passage pier, and returns to it. The same basic wave stops there.
{
 const support='act2-floor',x=7190,target='a2-enemy-19',aim={angle:163,power:.8},wall='ws-service-reflection-pier';
 const bounced=attack('mage',support,x,'M11',aim),stopped=attack('mage',support,x,'M01',aim);
 assert.equal(bounced.prediction.unit,target);assert(bounced.damage[target]>0);assert(bounced.contacts.some(c=>c.id===wall));assert(bounced.hits.some(h=>h.id===target&&h.bounces>=1));
 assert.equal(stopped.damage[target]||0,0);assert(stopped.contacts.some(c=>c.id===wall));
 rows.push({role:'Damheo: pier-return reflection',target,bounced,sameAimBasicControl:stopped});console.log('PASS Damheo: real pier reflection hits the lower elite; identical basic cast stops at the same pier');
}

// The west low gallery also has a usable solid ceiling reflection. A free
// direct basic shot underneath the raised guard remains an alternative. These are
// distinct approaches; no claim of identical pre-impact trajectories is made.
{
 const target='a2-enemy-8',bounced=attack('mage','act2-floor',4900,'M11',{angle:119,power:.65});
 assert(bounced.contacts.some(c=>c.id==='ws-service-vault-tooth'));assert(bounced.hits.some(h=>h.id===target&&h.bounces>=1));assert(bounced.damage[target]>0);
 const q=fixture('mage','act2-floor',4900),aim=aimAt(q,'M01',target);assert(aim,'Free shot can pass underneath the raised guard');const direct=fire(q,'M01',aim);assert(direct.damage[target]>0);assert.equal(direct.focusSpent,0);
 rows.push({role:'Damheo: low-ceiling reflection and direct alternative',target,bounced,freeAlternative:direct});console.log('PASS Damheo: the vault ceiling returns a live wave into an authored cart; free direct attack remains possible');
}

// Low-gallery support reaches the same middle target through a solid buttress.
// The path crossing is measured from live projectile segments; phase mode,
// speed, blast and target defenses are never overwritten to enable the hit.
for(const {target,aim,blocker,directSupport,directX}of [
 {target:'a2-enemy-9',aim:{angle:89.24574317789404,power:.785164790585202},blocker:'ws-east-hoist-buttress',directSupport:'ws-east-hoist-buttress',directX:6650},
 {target:'a2-enemy-19',aim:{angle:17.32070437028331,power:.7117949969866105},blocker:'ws-service-reflection-pier',directSupport:'act2-floor',directX:7190}
]){
 const piercing=attack('occultist','act2-floor',6350,'O04',aim),stopped=attack('occultist','act2-floor',6350,'O01',aim);
 assert.equal(piercing.prediction.unit,target);assert(piercing.damage[target]>0);assert(piercing.crossings.some(c=>c.id===blocker));assert.equal(piercing.contacts.length,0,'Terrain-phase skill does not collide with its crossed stone');
 assert.equal(stopped.damage[target]||0,0);assert(stopped.contacts.some(c=>c.id===blocker));
 const q=fixture('occultist',directSupport,directX),freeAim=aimAt(q,'O01',target);assert(freeAim,'Free ordinary shot exists from an exposed alternative');const direct=fire(q,'O01',freeAim);assert(direct.damage[target]>0);assert.equal(direct.focusSpent,0);
 rows.push({role:'Sodan: screened lower-gallery support',target,blocker,piercing,sameAimBasicControl:stopped,exposedFreeAlternative:direct});
 console.log('PASS Sodan:',blocker,'screens the ordinary shot; actual terrain-phase lance reaches',target,'and an exposed basic alternative exists');
}
// One bounded support sequence: O08 itself manifests an authored hidden spirit,
// then the real action review and hero selection hand the unchanged shot to Seolo.
// The blind control can incidentally collide, but is hidden and form-resistant.
{
 const targetId='a2-enemy-19',arrowAim={angle:146.60255654209595,power:.57686847170027},manifestAim={angle:113.94313411515503,power:.48491501065964215};
 const setup=()=>{
  const q=fixture('occultist','act2-floor',7050,{extraSkills:['O08']});g.HonroAct2.attach(q.app,q.e);
  const archer=q.e.unit('p-archer'),floor=q.b.terrain.find(t=>t.id==='act2-floor');
  Object.assign(archer,{x:7190,y:C.topAt(floor,7190),vx:0,vy:0,acted:false});
  for(const actor of [q.hero,archer]){assert(C.validTerrainContactPose(q.b.terrain,actor));assert(q.e.grounded(actor));assert(!q.b.units.some(u=>u.id!==actor.id&&!u.dead&&Math.abs(u.x-actor.x)<u.r+actor.r&&u.y>actor.y-actor.h&&u.y-u.h<actor.y),'Both initial support poses are body-clear');}
  const target=q.e.unit(targetId);assert(target.spiritHidden&&target.honroSpirit&&!target.manifested&&!target.revealSpiritToParty);
  return{q,archer,target};
 };
 const control=setup();assert(control.q.e.select(control.archer.id));control.q.hero=control.archer;
 const beforeVisibility={visible:g.HonroAct2.visible(control.q.b,control.target),guidance:control.q.e.guidanceTarget(control.archer,control.target)};assert.equal(beforeVisibility.visible,false);assert.equal(beforeVisibility.guidance,false);
 const before=fire(control.q,'A01',arrowAim);assert(before.damage[targetId]>0,'A blind incidental hit still follows production damage rules');
 const {q,archer,target}=setup(),immutable=u=>JSON.stringify({x:u.x,y:u.y,r:u.r,h:u.h,maxHp:u.maxHp,armor:u.armor,existenceDefense:u.existenceDefense,side:u.side}),targetBefore=immutable(target),archerBefore=JSON.stringify({level:archer.level,attack:archer.attack,ranks:archer.ranks});
 const support=fire(q,'O08',manifestAim);assert(support.hits.some(h=>h.id===targetId));assert.equal(immutable(target),targetBefore,'Manifestation does not change the target body, base defenses or max HP');
 assert(target.manifested&&target.revealSpiritToParty);assert.equal(target.formDamageTakenBonus,.92,'Use the actual Act2 manifestation adapter');assert.equal(target.manifestedUntil,q.b.round+2,'Legal rank-one manifestation lasts three rounds');
 const manifestedState={manifested:target.manifested,revealSpiritToParty:target.revealSpiritToParty,formDamageTakenBonus:target.formDamageTakenBonus,until:target.manifestedUntil};
 q.e.finishAction();for(let frame=0;frame<600&&q.b.phase==='review';frame++)q.e.tick(C.STEP);assert.equal(q.b.phase,'aim');assert(q.e.select(archer.id));q.hero=archer;
 const afterVisibility={visible:g.HonroAct2.visible(q.b,target),guidance:q.e.guidanceTarget(archer,target)};assert(afterVisibility.visible&&afterVisibility.guidance);
 assert.equal(JSON.stringify({level:archer.level,attack:archer.attack,ranks:archer.ranks}),archerBefore);
 const after=fire(q,'A01',arrowAim);assert.deepEqual(after.aim,before.aim);assert.deepEqual(after.from,before.from);assert.equal(after.prediction.unit,targetId);assert(after.damage[targetId]>before.damage[targetId]*5,'The same ordinary arrow becomes effective after the live support cast');assert.equal(after.focusSpent,0);
 const h=q.profile.heroes.occultist;
 rows.push({role:'Sodan: manifestation enables party targeting and form damage',target:targetId,beforeVisibility,before,support,manifestedState,afterVisibility,after,training:{xp:h.xp,level:C.levelOf(h),earned:C.pointsEarned(h),spent:C.pointsSpent(h,'occultist'),remaining:C.pointsLeft(h,'occultist'),ranks:h.ranks},scope:'One isolated O08 action followed by actual review and Seolo selection. No manual HP, manifestation, visibility or defense changes; O08 damage is separate from the two arrow samples.'});
 console.log('PASS Sodan O08: hidden/unselectable spirit becomes visible/selectable; identical live basic arrow damage',before.damage[targetId],'→',after.damage[targetId]);
}
assert.equal(JSON.stringify(stage),sourceScene,'The campaign stage is never changed by tactical fixtures');
assert.equal(JSON.stringify({skills:C.SKILLS,balances:g.HONRO_BALANCE}),physics,'No skill or balance coefficient is altered');
await mkdir('_local/reports/stage17-worksite',{recursive:true});
await writeFile('_local/reports/stage17-worksite/tactical-shots.json',JSON.stringify({
 scope:'Isolated actual-production attacks at supported firing poses. Non-firing actors retain authored poses during projectile/martial resolution. No route-wide movement, enemy turns, fullplay completion or browser verification is claimed.',
 actualLevel:example.hero.level,entryXp,entryBaseline:'HonroProgression.legacyCampaignAnchor(16): actual progression through Stage16',initialEnemies:sourceIds.length,
 trainingBudget:Object.fromEntries(example.profile.recruited.map(cls=>{const h=example.profile.heroes[cls];return[cls,{xp:h.xp,level:C.levelOf(h),earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),remaining:C.pointsLeft(h,cls),ranks:h.ranks}];})),
 training:'41,755 XP / level 13. Legal rank-one training via Core.train, including prerequisites and explicit earned/spent checks; no bonus stats or altered targets. The current-curve xpAt(plan.entryLevel) value is not used.',
 profile:example.profile,enemySites:stage.design.space.encounterSites,entryEnemyStats:example.e.alive(1).map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,maxHp:u.maxHp,armor:u.armor,attack:u.attack,elite:!!u.honroAct2Elite})),
 unchanged:{geometry:true,roster:true,physics:true,damageMechanisms:true,targetStats:true},rows
},null,2)+'\n');
console.log('PASS Stage17 tactical evidence:',rows.length,'role/terrain cases recorded');
