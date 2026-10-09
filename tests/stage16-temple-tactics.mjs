/** Stage16 tactical choices on the unchanged canonical temple. Each isolated
 * case begins at declared body-clear hero poses; every shot then resolves with
 * Engine.fire and full Engine.tick, including normal body physics. These are
 * combat-effect fixtures, not arrival routes, enemy turns or normal fullplay. */
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {g,C,stage,sourceIds,entryXp,readiness,fixture,fire} from './stage16-temple-tactics-helper.mjs';
const rows=[],plain=x=>JSON.parse(JSON.stringify(x)),hash=x=>createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const sourceScene=JSON.stringify(stage),physics=JSON.stringify({skills:C.SKILLS,balances:g.HONRO_BALANCE});
const hit=(shot,id)=>{assert(shot.damage[id]>0,id+' takes actual HP loss');assert.equal(shot.damageEvents.filter(v=>v.target===id).reduce((s,v)=>s+v.amount,0),shot.damage[id],'Native hurt events corroborate HP difference');};
const count=(shot,ids)=>ids.filter(id=>shot.damage[id]>0).length;
const attack=(cls,support,x,skill,aim)=>fire(fixture(cls,support,x),skill,aim);
assert.equal(sourceIds.length,35);assert.equal(stage.units.filter(u=>u.team==='enemy'&&u.stageOverrides?.honroAct2Elite).length,8);
assert.equal(stage.design.space.topologyId,'monumental-cave-temple-cloister-and-undercroft');
const example=fixture('archer','tm-great-hall-plinth',6500);
assert.equal(example.hero.level,13);assert.equal(entryXp,37445);

// Two supported heights aim at the SAME existing screen. Swapping their actual
// angle/charge either hits the stone plinth or a different rear defender.
{
 const target='tm-hall-screen',lowAim={angle:1.6175323084719204,power:.6719319020472235},highAim={angle:-12.34775109546585,power:.9371401544154627};
 const low=attack('archer','tm-great-hall-plinth',6500,'A01',lowAim),high=attack('archer','tm-hall-side-gallery',5530,'A01',highAim);
 for(const shot of [low,high]){hit(shot,target);assert.equal(shot.prediction.unit,target);assert.equal(shot.focusSpent,0);assert.equal(shot.contacts.length,0);}
 assert.equal(low.from.y-high.from.y,540);assert.notEqual(low.aim.angle,high.aim.angle);assert.notEqual(low.aim.power,high.aim.power);assert(high.frames>low.frames);
 const lowWrong=attack('archer','tm-great-hall-plinth',6500,'A01',highAim),highWrong=attack('archer','tm-hall-side-gallery',5530,'A01',lowAim);
 assert.equal(lowWrong.damage[target]||0,0);assert(lowWrong.contacts.some(c=>c.id==='tm-great-hall-plinth'));
 assert.equal(highWrong.damage[target]||0,0);hit(highWrong,'a2-enemy-13');
 rows.push({role:'Seolo: low plinth and high side-gallery trajectories',target,verticalSeparation:540,low,high,swappedHighAimOnLow:lowWrong,swappedLowAimOnHigh:highWrong});
 console.log('PASS Seolo: same target from 540px-separated heights; swapped trajectories hit stone or the rear defender');
}

// First pose is outside S00 reach. Only ordinary movement, charged to the
// current turn's finite movement allowance, brings the same slash into range.
{
 const support='tm-great-hall-plinth',target='a2-enemy-11',start=5470,aim={angle:185,power:1};
 const far=attack('knight',support,start,'S00',aim);assert.equal(far.damage[target]||0,0);
 const q=fixture('knight',support,start),before=q.hero.moveLeft,poseBefore={x:q.hero.x,y:q.hero.y};let movementFrames=0;
 while(q.hero.x>5350&&movementFrames<100){assert.equal(q.b.phase,'aim');q.e.move(-1,C.STEP);q.e.tick(C.STEP);movementFrames++;}
 const moveSpent=before-q.hero.moveLeft;assert(Math.abs(q.hero.x-5350)<1);assert(moveSpent>=119&&moveSpent<=124);assert(q.hero.moveLeft>0);assert(C.validTerrainContactPose(q.b.terrain,q.hero));
 const close=fire(q,'S00',aim);hit(close,target);assert.deepEqual(close.aim,far.aim);assert.equal(close.from.x,close.to.x);assert.equal(close.focusSpent,8,'Charged basic sword consumes its real focus cost');
 rows.push({role:'Hwigyeom: paid normal approach and basic melee',target,poseBefore,movementFrames,moveSpent,remainingMovement:q.hero.moveLeft,far,close});
 console.log('PASS Hwigyeom: normal 120px approach changes identical basic slash from miss to actual melee damage');
}

// The role clusters are compared using live area damage and free alternatives.
// No radius, secondary reach, actor spacing or HP value is edited by the test.
for(const c of [
 {name:'front-court stone-lantern pair',support:'act2-floor',x:1100,ids:['a2-enemy-0','a2-enemy-1'],area:{angle:12.161015118903586,power:.7447168499788914},basic:{angle:12.619804813215339,power:.7481621759552732},basicHits:1},
 {name:'hall-front guard and elite triangle',support:'tm-great-hall-plinth',x:5700,ids:['a2-enemy-10','a2-enemy-11','a2-enemy-12'],area:{angle:125,power:.5},basic:{angle:127,power:.5},basicHits:2,arrow:{angle:127,power:.35}},
 {name:'archive ground guards and overhead bat',support:'act2-floor',x:9680,ids:['a2-enemy-17','a2-enemy-20','a2-enemy-21'],area:{angle:174.58688563523057,power:.6913755730989066},basic:{angle:174.1855461471563,power:.6931337981828093},basicHits:1}
]){
 const area=attack('mage',c.support,c.x,'M04',c.area),basic=attack('mage',c.support,c.x,'M01',c.basic);
 for(const id of c.ids)hit(area,id);assert.equal(count(area,c.ids),c.ids.length);assert.equal(count(basic,c.ids),c.basicHits);assert.equal(basic.focusSpent,0);assert.equal(area.damage['p-mage']||0,0);
 const arrow=c.arrow?attack('archer',c.support,c.x,'A01',c.arrow):null;if(arrow){assert.equal(count(arrow,c.ids),1);assert.equal(arrow.focusSpent,0);hit(arrow,'a2-enemy-12');}
 rows.push({role:'Damheo: rank-one clustered area attack',place:c.name,targets:c.ids,blastRadius:C.SKILLS.M04.radius,area,freeBasicAlternative:basic,...arrow?{singleArrowControl:arrow}:{}});
 console.log('PASS Damheo:',c.name,'actual area hits',count(area,c.ids),'; free wave hits',count(basic,c.ids));
}

// Actual authored stone reflects the wave into an existing target. Controls
// preserve angle and charge. The western same-angle basic cast is deliberately
// unsafe and self-damages; its separately aimed free alternative is safe.
for(const c of [
 {name:'west-cloister stone return',support:'tm-cloister-landing',x:4650,target:'a2-enemy-7',wall:'tm-west-reflection-wall',bounce:{angle:45,power:.5},direct:{angle:116.19017813627273,power:.5210744883254981},selfDamageControl:true},
 {name:'undercroft stone return',support:'act2-floor',x:6500,target:'tm-lower-flank',wall:'tm-undercroft-reflector',bounce:{angle:8,power:.8},direct:{angle:182.0743019653756,power:.48395278517480844}}
]){
 const bounced=attack('mage',c.support,c.x,'M11',c.bounce),stopped=attack('mage',c.support,c.x,'M01',c.bounce),direct=attack('mage',c.support,c.x,'M01',c.direct);
 hit(bounced,c.target);assert(bounced.contacts.some(h=>h.id===c.wall));assert(bounced.hits.some(h=>h.id===c.target&&h.reflectCount===1));assert.equal(bounced.reflectCount,1);assert.equal(bounced.damage['p-mage']||0,0);
 assert.equal(stopped.damage[c.target]||0,0);assert(stopped.contacts.some(h=>h.id===c.wall));if(c.selfDamageControl)assert(stopped.damage['p-mage']>0);
 hit(direct,c.target);assert.equal(direct.focusSpent,0);assert.equal(direct.contacts.length,0);assert.equal(direct.damage['p-mage']||0,0);
 rows.push({role:'Damheo: rank-one wall reflection and safe free alternative',place:c.name,target:c.target,wall:c.wall,bounced,sameAimBasicControl:stopped,freeDirectAlternative:direct,...c.selfDamageControl?{controlWarning:'Identical angle with M01 splashes the caster at the near wall; it is a failed control, not the safe alternative.'}:{}});
 console.log('PASS Damheo:',c.wall,'actual reflectCount1 hit; same-angle basic stops; safely re-aimed free cast also hits');
}

// O08 is not approximated by state writes: the native cast manifests an
// authored hidden spirit, native tick finishes review, and select hands the
// party action to Seolo. The same free arrow's true form-damage changes.
{
 const targetId='tm-archive-rear',arrowAim={angle:41,power:.35},manifestAim={angle:34.585005526351424,power:.6468921326895859};
 const setup=()=>fixture('occultist','act2-floor',9800,{poses:[{cls:'archer',support:'act2-floor',x:9900}]}),body=u=>plain({x:u.x,y:u.y,r:u.r,h:u.h,maxHp:u.maxHp,armor:u.armor,existenceDefense:u.existenceDefense,side:u.side,attack:u.attack});
 const control=setup(),controlTarget=control.e.unit(targetId),controlArcher=control.e.unit('p-archer');
 assert(controlTarget.spiritHidden&&controlTarget.honroSpirit&&!controlTarget.manifested);
 assert(control.e.select(controlArcher.id));control.hero=controlArcher;
 const beforeVisibility={visible:g.HonroAct2.visible(control.b,controlTarget),guidance:control.e.guidanceTarget(controlArcher,controlTarget)};assert.equal(beforeVisibility.visible,false);assert.equal(beforeVisibility.guidance,false);
 const before=fire(control,'A01',arrowAim);hit(before,targetId);
 const q=setup(),target=q.e.unit(targetId),archer=q.e.unit('p-archer'),originalBody=body(target),archerStats=plain({level:archer.level,attack:archer.attack,ranks:archer.ranks});
 const support=fire(q,'O08',manifestAim);hit(support,targetId);assert(support.hits.some(h=>h.id===targetId));assert.deepEqual(body(target),originalBody);assert(target.manifested&&target.revealSpiritToParty);assert.equal(target.formDamageTakenBonus,.92);assert.equal(target.manifestedUntil,q.b.round+2);
 let reviewFrames=0;while(q.b.phase!=='aim'&&reviewFrames<600){assert(['flight','review'].includes(q.b.phase));q.e.tick(C.STEP);reviewFrames++;}assert.equal(q.b.phase,'aim');assert(q.e.select(archer.id));q.hero=archer;
 const afterVisibility={visible:g.HonroAct2.visible(q.b,target),guidance:q.e.guidanceTarget(archer,target)};assert(afterVisibility.visible&&afterVisibility.guidance);assert.deepEqual(body(target),originalBody);assert.deepEqual(plain({level:archer.level,attack:archer.attack,ranks:archer.ranks}),archerStats);
 const after=fire(q,'A01',arrowAim);hit(after,targetId);assert.deepEqual(after.from,before.from);assert.deepEqual(after.aim,before.aim);assert(after.damage[targetId]>before.damage[targetId]*5);assert.equal(after.focusSpent,0);
 const freeAlternative=attack('occultist','act2-floor',9800,'O01',{angle:29,power:.35});hit(freeAlternative,targetId);assert.equal(freeAlternative.focusSpent,0);
 rows.push({role:'Sodan: actual O08 makes a companion form attack effective',target:targetId,initialPoses:q.initialPoses,beforeVisibility,before,support,reviewFrames,manifestedState:{manifested:target.manifested,revealSpiritToParty:target.revealSpiritToParty,formDamageTakenBonus:target.formDamageTakenBonus,until:target.manifestedUntil},afterVisibility,after,freeSoulAlternative:freeAlternative,scope:'O08 damage is recorded separately. Target body/base defenses and Seolo attack/rank/level are unchanged. No manual manifestation, HP, defense or visibility assignment.'});
 console.log('PASS Sodan O08: actual support and native review/selection change identical free arrow damage',before.damage[targetId],'→',after.damage[targetId]);
}
assert.equal(JSON.stringify(stage),sourceScene);assert.equal(JSON.stringify({skills:C.SKILLS,balances:g.HONRO_BALANCE}),physics);
await mkdir('_local/reports/stage16-temple',{recursive:true});
await writeFile('_local/reports/stage16-temple/tactical-shots.json',JSON.stringify({
 scope:'Isolated native combat-effect proof with explicitly initialized body-clear hero starting poses and initial friendly turn. Engine.fire/full Engine.tick and normal movement resolve effects. No normal arrival, enemy-AI cycle, fullplay completion, human difficulty or browser verification is claimed.',
 provenance:{stageSha256:hash(stage),controllerSha256:hash(await readFile(new URL(import.meta.url),'utf8')),helperSha256:hash(await readFile(new URL('./stage16-temple-tactics-helper.mjs',import.meta.url),'utf8'))},
 actualLevel:example.hero.level,entryXp,entryBaseline:readiness.scope,initialEnemies:sourceIds.length,explicitElites:8,enemyActionLimit:4,
 trainingBudget:Object.fromEntries(example.profile.recruited.map(cls=>{const h=example.profile.heroes[cls];return[cls,{xp:h.xp,level:C.levelOf(h),earned:C.pointsEarned(h),spent:C.pointsSpent(h,cls),remaining:C.pointsLeft(h,cls),ranks:plain(h.ranks),loadout:plain(example.profile.loadouts[cls])}];})),
 training:'Actual first-clear/recruit rewards through Stage15 produce 37,445 XP / level13 / 27 points. Existing camp talents are refunded with Core.untrain; all needed prerequisites and rank-one skills are trained with Core.train, without bonus stats. At most four active slots.',
 initialEnemyStats:example.e.alive(1).map(u=>({id:u.id,x:u.x,y:u.y,h:u.h,r:u.r,hp:u.hp,maxHp:u.maxHp,armor:u.armor,attack:u.attack,elite:!!u.honroAct2Elite})),
 unchanged:{campaign:true,skills:true,balance:true,terrain:true,enemyRoster:true,enemyStartingPoses:true,enemyBaseStats:true},rows
},null,2)+'\n');
console.log('PASS Stage16 tactical evidence:',rows.length,'role/terrain comparisons, each backed by real native damage');
