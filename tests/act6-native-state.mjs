/** Normal Act 6 owners and engine under supplied contacts/events. No UI or play-time claims. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {createStage55EmptyBell,STAGE55} from '../shared/runtime/stage55-pilot-owner.mjs';
import {stage57Adapter} from '../shared/runtime/stage57-adapter.mjs';
import {createNormalWarmPort} from '../shared/runtime/normal-scope.mjs';
import {stage58Adapter} from '../shared/runtime/stage58-normal-adapter.mjs';
import {BOSS58} from '../shared/runtime/stage58-owner.mjs';
import {stage59Adapter} from '../shared/runtime/stage59-adapter.mjs';
import {FRONTS59,STAGE59,sentries59} from '../shared/runtime/stage59-owner.mjs';
import {ACT6_EXTERIOR_ENCOUNTERS,installExteriorEncounters} from '../shared/act6-mumyeongsa/exterior-encounters.mjs';
import {hallB58,verifyHallD56,legacyHallExit56,hallSill} from '../shared/act6-mumyeongsa/hall-b.mjs';
import {verifyReturnGate,watchReturnGate} from '../shared/act6-mumyeongsa/return-gate.mjs';
import {createBrokenRail,validBrokenRailCrossing} from '../shared/act6-mumyeongsa/broken-rail.mjs';
import {validTornEave} from '../shared/act6-mumyeongsa/torn-eave.mjs';
import {validSodanThread, mountRetreatSodan, mountSodanSpirit, debitSodanThread, sodanInnerTree} from '../shared/act6-mumyeongsa/sodan-thread.mjs';
import {company54,verifyStage54Relay} from '../shared/runtime/stage54-pilot-owner.mjs';
import {createChapterBoundary} from '../shared/act6-boundary/chapter-boundary.mjs';
import {planThresholdPrep} from '../shared/runtime/act6-threshold-prep.mjs';
import {createFirstMissionOwner} from '../shared/runtime/act6-first-missions.mjs';
import {prepareEnding} from '../shared/runtime/stage60-ending.mjs';
import {endingCardFor} from '../shared/runtime/stage60-card.mjs';
import {attachStage59Forepaw} from '../shared/act6-late-qa/normal-stage59-forepaw-cue.mjs';

const read=async q=>JSON.parse(await readFile(new URL('../'+q,import.meta.url),'utf8'));
const sha=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const shaText=v=>createHash('sha256').update(v).digest('hex');
const fixtures=await read('shared/act6-debug-stages/fixtures.json');
const intake=await read('shared/data/act6-qa/first-two.json');
const names={53:'third',54:'fourth',55:'fifth',56:'sixth',57:'seventh',58:'eighth',59:'ninth',60:'tenth'};
const pack=async id=>id<=52?{map:JSON.parse(intake.rows[id].entry.mapBytesUTF8),library:JSON.parse(intake.rows[id].entry.assetBytesUTF8)}:read('shared/data/act6-qa/'+names[id]+'.json');
process.env.HONRO_ACT4_RELEASE='1';
process.env.HONRO_ACT5_RELEASE='1';
const G=await runtime({legacyMaps:false,productionStory:true}),C=G.HONRO_CORE;
const stateChecks={},ledger={};
const near59='finale-cutout-near-body',high59='finale-cutout-west-terrace',K=7800/2172;
const clone=structuredClone;
const live=u=>u&&u.hp>0&&!u.dead;
const enemies=b=>b.units.filter(u=>u.side===1&&live(u));
const players=b=>b.units.filter(u=>u.side===0&&!u.summoned);
const normalize=v=>G.HonroProfileStore.migrate(typeof v==='string'?v:JSON.stringify(v));
const rawProfile=id=>normalize(fixtures[id].profile);
const previous=id=>clone(fixtures[id].body.terminal);
const compiled=p=>G.HonroMaps.compile(p.map,{library:p.library});
const descriptor=(p,c)=>({id:p.id,scope:'normal-private-pilot',authoredId:p.id===57?p.authoredId:'stage-'+p.id,playSHA:sha(c.terrain),worldSHA:sha(c.worldTerrain)});

function make57Boundary(t,e){
 const crew=Object.fromEntries(players(e.b).map(u=>[u.cls,clone(u)]));
 return {stage:57,won:true,settlement:false,flags:t.flags,crew,boundary:{full:crew,
  receiving:Object.fromEntries(t.body.map(row=>[row.role,{x:row.receiving[0],y:row.receiving[1]}])),
  guard:t.guard,association:t.association}};
}
function carrier(id,p,c,profile,units,objective){
 const b=C.createBattle(1,profile,'campaign',{party:units.filter(u=>u.side===0).map(u=>u.cls)});
 Object.assign(b,{stage:id,stageId:id,honroStage:id,honroAuthoredId:'stage-'+id,honroMapOrigin:'campaign',
  mode:'campaign',honroCanonical:true,honroCustom:false,honroJourneyReplay:false,
  honroTerrainDomainVersion:2,width:p.map.width,height:p.map.height,terrain:c.terrain,honroWorldTerrain:c.worldTerrain,
  honroPlayBounds:p.map.playBounds,honroTerrainBounds:p.map.terrainBounds,honroLandmarks:clone(c.landmarks),honroElements:clone(c.elements),
  honroState:{flags:{}},units:units.slice(),side:0,phase:'aim',round:1,
  shot:0,queue:units.filter(u=>u.side===0).map(u=>u.id),active:units.find(u=>u.side===0).id,
  enemyLimit:id===59?8:4,honroActiveLimit:id===59?8:4,projectiles:[]});
 delete b.honroGrowth;
 const events=[],notices=[];
 const e=new C.Engine(b,ev=>events.push(ev),true);
 const stage={...G.HONRO_CONTENT.stages[49],id,objective};
 Object.defineProperty(e,'stage',{get:()=>stage});
 const app={engine:e,stage,stageId:id,profile,normalProfile:profile,screen:'battle',done:false,notify:q=>notices.push(q)};
 e.checkEnd=()=>false;
 return {b,e,app,events,notices,c};
}
function foot(e,u,x,id){
 const t=e.b.terrain.find(q=>q.id===id);assert(t,'support '+id);
 const y=C.topAt(t,x);
 Object.assign(u,{x,y,vx:0,vy:0,airborne:false,jumping:false,acted:false,moveLeft:u.maxMove,moving:0});
 assert(e.grounded(u)&&C.validTerrainContactPose(e.b.terrain,u),'physical foot '+JSON.stringify({id:u.id,x,y,support:id}));
 return u;
}
function actor(e,cls,x,id){
 const u=e.b.units.find(v=>v.side===0&&v.cls===cls);assert(u,cls);
 Object.assign(e.b,{side:0,phase:'aim',active:u.id,projectiles:[]});
 return foot(e,u,x,id);
}
function enemyTurn(e,unit,action){
 Object.assign(e.b,{side:1,active:unit.id,phase:'enemy',queue:[unit.id],projectiles:[]});
 unit.acted=false;
 return action();
}

async function make57(){
 const p=await pack(57),c=compiled(p),profile=rawProfile(57),prev=previous(57),d=descriptor(p,c);
 const key=Object.freeze({});
 const port=createNormalWarmPort({verifyPacket:q=>q.packet===p&&q.compiled===c&&q.descriptor===d,stillOwnsPredecessor:()=>false,authorizeCold:(k,a,r,id)=>k===key&&r===prev&&id===57});
 const adapter=stage57Adapter(G,{normalPort:port});
 const prepared=await adapter.prepare({descriptor:d,packet:p,compiled:c,previous:prev});assert(prepared,'57 adapter prepare');
 const h=carrier(57,p,c,profile,prepared.units,'act6-fallback-reunite');
 h.b.honroTerrainBounds=p.bridge.base.terrainBounds;h.b.honroPlayBounds=p.bridge.base.playBounds;
 h.b.honroTerrainDomainVersion=p.bridge.base.domainVersion;
 h.b.terrain=prepared.terrain;Object.assign(h.b.honroState.flags,prepared.entryFlags);
 const e=h.e;h.app.engine=null;
 const grant=port.prepare({id:57,app:h.app,previous:prev,packet:p,descriptor:d,compiled:c,coldLease:key});assert(grant,'57 signed warm port');
 h.app.engine=e;
 const owner=adapter.attach({app:h.app,engine:e,prepared,receipt:prev,grant});assert(owner,'57 owner attach');
 return {...h,owner,p};
}
async function make58(next=null){
 const p=await pack(58),c=compiled(p),profile=rawProfile(58),prev=next??previous(58);
 const adapter=stage58Adapter(G,{verifyPrevious:q=>q===prev,verifyAdmission:(a,e)=>a.engine===e});
 const prep=await adapter.prepare({descriptor:descriptor(p,c),packet:p,compiled:c,previous:prev});assert(prep,'58 bridge prepare');
 const h=carrier(58,p,c,profile,prep.units,'act6-daedosa-revision');
 const owner=adapter.attach({app:h.app,engine:h.e,prepared:prep,returnRoute:()=>h.returnRoute,isVanguard:u=>h.exterior?.owns(u)});assert(owner,'58 owner attach');
 const H=hallB58(),terrain=H.terrain.map(t=>G.HonroGeometry.terrain(t,h.b.height));
 h.b.terrain=[...h.b.terrain,...terrain];h.b.honroWorldTerrain=[...h.b.honroWorldTerrain,...terrain];h.e.invalidateTerrainCollisionIndex();
 h.returnRoute=watchReturnGate(h.e,C,prep.units.slice());
 h.exterior=installExteriorEncounters(h.app,h.e,()=>owner.project()?.skipReturn===true,undefined,G);
 return {...h,owner,p};
}
function beat(e,x,y,phase,exterior){
 const u=players(e.b)[0];
 Object.assign(e.b,{side:0,phase:'aim',active:u.id,projectiles:[]});
 const f=e.contactSurface(x,y-180,y+180);assert(f,'wave approach '+[x,y,phase]);
 foot(e,u,x,f.t.id);e.refreshActivation();
 exterior.tick(.01);
 for(let i=0;i<120;i++)exterior.tick(1/120);
}
function activeCount(b){return enemies(b).filter(u=>u.awake&&(u.loadout?.length||u.id==='a6-c08-boss')).length;}
function at58(e,cls,x){return actor(e,cls,x,'local-lower-08-body');}
function hurt(e,u,amount,owner='p-mage'){return e.hurt(u,amount,owner,true,undefined,{x:u.x,y:u.y-u.h/2},'normal');}

async function test58(){
 const {e,b,app,owner,exterior}=await make58();
 assert.equal(players(b).length,4);assert.equal(enemies(b).length,ACT6_EXTERIOR_ENCOUNTERS[58].initial.length);assert(!e.unit('a6-c08-boss'));
 at58(e,'mage',3680);assert(!owner.interact('threshold').ok);assert(!e.unit('a6-c08-boss'));
 at58(e,'occultist',3496);assert(owner.interact('column').ok);
 assert(!e.unit('a6-c08-boss'),'column alone cannot summon');
 beat(e,3488,3210,0,exterior);
 assert(!b.units.some(u=>u.honroSpawnSource==='apse-lower'||u.honroSpawnSource==='folded-rear'));
 at58(e,'mage',3680);assert(owner.interact('threshold').ok);
 const boss=e.unit('a6-c08-boss'),party=players(b).slice();assert(boss&&boss.honroRigAsset==='boss_daedosa');
 assert.equal(boss.maxHp,BOSS58.body.hp,'real boss manifestation applies the final body');
 assert(boss.h>=BOSS58.body.h*.75&&boss.r>=BOSS58.body.r*.75&&C.validTerrainContactPose(b.terrain,boss));
 assert.equal(b.honroDaedosa.phase,1);assert(!e.unit('a6-c08-expansion-node'));
 const marks=[];
 const turn=()=>{
  enemyTurn(e,boss,()=>e.enemyAction());
  const r=b.honroDaedosa;
  marks.push({phase:r.phase,mark:r.mark?.kind,exposed:r.exposed,hp:boss.hp,history:r.history.at(-1)?.kind});
 };
 turn();assert.equal(b.honroDaedosa.mark?.kind,'band');
 hurt(e,boss,100000);assert.equal(boss.hp,7600);assert.equal(b.honroDaedosa.phase,1);
 for(const [i,u] of party.entries())foot(e,u,2920+i*64,'local-lower-08-body');
 for(let i=0;i<3&&b.honroDaedosa.phase!==2;i++)turn();
 assert.equal(b.honroDaedosa.phase,2);assert.equal(b.honroDaedosa.mark?.kind,'zone');
 assert(b.physics.regions.some(f=>f.id==='a6-c08-stage-proj-02'));
 assert(!e.unit('a6-c08-expansion-node'));
 beat(e,4315,3080,2,exterior);
 for(const [i,u] of party.entries())foot(e,u,2920+i*64,'local-lower-08-body');
 const zone=b.honroDaedosa.mark;
 b.stakes=[{skill:'M09',side:0,x:(zone.x0+zone.x1)/2}];
 hurt(e,boss,100000);assert.equal(boss.hp,4600);assert.equal(b.honroDaedosa.phase,2);
 for(let i=0;i<3&&b.honroDaedosa.phase!==3;i++)turn();
 assert.equal(b.honroDaedosa.phase,3);
 assert(owner.inspect().log.some(r=>r.kind==='stake-held'),'phase 2 reads a stake in the real zone');
 const node=e.unit('a6-c08-expansion-node');assert(node);
 assert(b.physics.regions.some(f=>f.id==='local-08-ledger-marginal-strike'));
 for(const [i,u] of party.entries())foot(e,u,4900+i*75,'local-lower-08-body');
 owner.tick();
 // The centre is still occupied at the turn of the third phase. Open the
 // lower route by clearing its two committed defenders with native damage.
 for(const id of ['a6-c08-vessel-a','a6-58-opening-3','a6-58-apse-lower-3']){
  const guard=e.unit(id);if(live(guard))hurt(e,guard,100000);
 }
 beat(e,4685,3250,3,exterior);
 // Let phase three spend a real charge at the two different contact regions.
 // The temple shadow must protect the original archer while the open floor
 // takes the full mark. The subsequent node kill interrupts the next charge.
 for(let i=0;i<5&&b.honroDaedosa.mark?.kind!=='great';i++)turn();
 assert.equal(b.honroDaedosa.mark?.kind,'great');
 const archer=party.find(u=>u.cls==='archer'),knight=party.find(u=>u.cls==='knight');
 foot(e,archer,3000,'local-lower-08-body');foot(e,knight,4945,'local-lower-08-body');
 const sheltered=[archer.hp,archer.shield],open=[knight.hp,knight.shield];
 turn();
 assert.deepEqual([archer.hp,archer.shield],sheltered);
 assert(knight.hp+knight.shield<open[0]+open[1],'exposed route actually takes the phase-three mark');
 beat(e,4685,3250,3,exterior);
 const waves=[...new Set(b.units.map(u=>u.honroSpawnSource).filter(Boolean))];
 const geometry=[...new Set(b.units.filter(u=>u.honroSpawnSource).map(u=>u.honroEncounterSupport))];
 assert(waves.includes('apse-lower')&&waves.includes('folded-rear'),JSON.stringify({waves,active:b.active,phase:b.honroDaedosa.phase,
  busy:e.settleBusy(),foes:enemies(b).map(u=>[u.id,u.awake,u.x,u.y])}));
 assert(geometry.includes('m58-east-deck')&&geometry.includes('local-lower-08-body'));
 assert(activeCount(b)<=9&&b.enemyLimit===6,JSON.stringify({active:activeCount(b),attack:b.enemyLimit}));
 const counts={conditionalActors:b.units.filter(u=>u.side===1&&!u.honroFieldController&&u.id!==node.id).length,active:activeCount(b),attackCap:b.enemyLimit};
 assert(counts.conditionalActors>=16,JSON.stringify({...counts,foes:b.units.filter(u=>u.side===1).map(u=>u.id)}));
 at58(e,'mage',3680);assert(!owner.interact('stake').ok&&owner.terminal()===null);
 hurt(e,boss,100000);assert(owner.project().flags.bossDead&&!owner.project().flags.nodeDead);
 assert(!owner.interact('stake').ok,'boss must not stand in for the working node');
 hurt(e,node,100000);assert(owner.project().flags.nodeDead);
 assert(owner.interact('stake').ok);
 assert(!owner.project().complete,'stake must not skip R');
 for(const [i,u] of party.entries()){
  Object.assign(b,{side:0,phase:'aim',active:u.id});
  foot(e,u,3295,'local-lower-08-body');
  for(let n=0;n<400&&u.x>2980+i*62;n++)e.walk(u,-1,1/120,true);
 }
 owner.tick();
 assert(owner.project().complete,JSON.stringify(owner.project()));
 b.phase='won';app.done=true;
 const terminal=owner.terminal();assert(terminal&&verifyReturnGate(terminal.returnGate,Object.fromEntries(party.map(u=>[u.cls,u]))));
 assert(owner.terminal()===null,'58 terminal cannot be issued twice');
 const entered=previous(58),signed=sealPort(app,58,{terminal});
 const next=await signed.port.checkpoint({app,engine:e,store:signed.store,terminal,upstream:entered,to:59,
  pin:fixtures[59].body.pin,expectedRaw:signed.raw(),stageSeed:app.stage,budget:{id:58}});
 assert(next.ok&&signed.writes()===1,JSON.stringify(next));
 assert.deepEqual(signed.port.inspect(app),{kind:'restorable',to:59});
 const lost=await make58(),saved=sealPort(lost.app,58),held=saved.raw();
 hurt(lost.e,players(lost.b)[0],100000,'');
 assert(lost.owner.project().failed&&!lost.owner.project().complete&&lost.owner.terminal()===null);
 lost.b.phase='lost';lost.app.done=true;
 const denied=await saved.port.checkpoint({app:lost.app,engine:lost.e,store:saved.store,terminal:null,upstream:entered,to:59,
  pin:fixtures[59].body.pin,expectedRaw:held,stageSeed:lost.app.stage,budget:{id:58}});
 assert(!denied.ok&&saved.writes()===0&&saved.raw()===held);
 stateChecks[58]={starts:4,counts,waves,geometry,marks,greatContrast:{sheltered,open,openAfter:[knight.hp,knight.shield]},events:owner.inspect().log.map(x=>x.kind),outgoing:terminal.flags,
  receivedIdentities:party.map(u=>u.id),next59SHA256:shaText(signed.raw()),loss:{blocked59:denied.reason,originalSHA256:shaText(held)},
  conditional:'Native state contacts and damage events. No play or timing.'};
 return terminal;
}

const west57='local-lower-07-west', body57='a6-c07-original-darmheo-body', ward57='a6-c07-stationary-stone-ward';
function rescue57(h){
 const {e,b,owner}=h,flags=b.honroState.flags;
 const sodan=players(b).find(u=>u.cls==='occultist');
 const tether=mountRetreatSodan({e,scene:{unitBody(){}},body:sodan,reunionMark:h.p.bridge.required.marker});
 actor(e,'occultist',5036,west57);
 assert(tether.seated()&&sodan.fixed&&e.canAct());
 assert(!e.walk(sodan,-1,.1)&&!e.jump(sodan)&&!e.canDrop(sodan));
 e.impulse(sodan,400,-200);assert.equal(sodan.vx,0);assert.equal(sodan.vy,0);
assert(owner.interact('warnBell').ok);
 const relay=b.terrain.find(t=>t.id==='a6-c07-protective-relay');
 e.damageTerrain(relay,12,0,'a6-c07-ward-pressure');assert(owner.interact('repairRelay').ok);
 actor(e,'knight',3332,west57);assert(owner.interact('warnRailing').ok);
 for(let i=0;i<95;i++)e.tick(1/120);
 assert.match(owner.interact('openRetreat').reason,/휘겸/);
 assert.equal(b.terrain.find(t=>t.id==='a6-c07-railing').broken,false);
 actor(e,'knight',3428,west57);assert(owner.interact('openRetreat').ok);
 assert(flags.bridgeRetreatOpened&&!tether.sync()&&!sodan.fixed);
 actor(e,'occultist',1905,west57);assert(owner.interact('moveRelayToFallback').ok);
 assert(tether.sync()&&sodan.fixed);
 actor(e,'knight',1958,west57);
 actor(e,'archer',2034,west57);owner.tick();assert(owner.interact('assistKeeper').ok);
 assert(!tether.sync()&&!sodan.fixed);
 const keeper=e.unit('local-07-gwakjin-return-keeper');assert(keeper&&keeper.side===0);
 Object.assign(b,{active:keeper.id,phase:'aim',side:0});foot(e,keeper,2028,west57);
 assert(owner.interact('receiveKeeperWatch').ok);assert.equal(keeper.side,2);
 actor(e,'archer',5358,ward57);
 actor(e,'knight',5292,west57);
 actor(e,'occultist',5297,west57);
 owner.tick();return keeper;
}
function sealPort(app,stage,opts={}){
 const f=fixtures[stage], profile=normalize(f.profile), seal={body:clone(f.body),sha:sha(f.body)};
 const key='honro-first-act-profile-1';
 let stored=JSON.stringify({...profile,honroAct6ChapterBoundary:seal}),writes=0;
 const store={locked:false,save(v){stored=JSON.stringify(v);writes++;return true;}};
 const p=createChapterBoundary({slot:f.body.slot,key,storage:{getItem:k=>k===key?stored:null},
  locks:{request:(_name,_options,fn)=>fn()},normalize,hash:shaText,
  releasePin:id=>[stage,stage+1].includes(id)?fixtures[id]?.body.pin:null,
  verifyOwner:(a,e,t,id)=>a===app&&a.engine===e&&t===opts.terminal&&id===stage+1,
  verifyCold:(a,w,id)=>a===app&&w===store&&id===stage&&a.screen==='rest'&&!a.engine,
  verifyReturn:verifyReturnGate,verifyRelay54:()=>false,verifyBridge:()=>false,verifyEave:()=>false,verifyThread:()=>true,
  verifyD:(u,proof,options)=>opts.slice?verifyHallD56(C,opts.slice,u,proof,options):false,legacyD:legacyHallExit56,
  verifyRetry57:(a,w)=>a===app&&w===store&&a.done&&a.engine?.b.phase==='lost'&&opts.owner?.project().failed===true,
  ownedStore:(a,w)=>a===app&&w===store,originalProfile:a=>a===app?profile:null});
 assert(p);
 return {port:p,store,raw:()=>stored,writes:()=>writes};
}

async function testBoundaryRecipes(){
 const rail=createBrokenRail(await read('shared/act6-b-slice/layout.json'));
 const sill=(await pack(54)).charts.L.terrain.find(t=>t.id==='mid-contact');
 const slice=(await pack(57)).bridge.additions.terrain.find(t=>t.id==='local-07-08-exact-receiving-slice');
 const key='honro-first-act-profile-1',results={};
 for(const [id,fixture] of Object.entries(fixtures)){
  const to=Number(id),base=normalize(fixture.profile),app={profile:base,normalProfile:base,engine:null,screen:'rest'};
  const sourceJSON=JSON.stringify(fixture),start=clone(fixture.body);
  let raw,writes=0,mounts=0;
  const store={locked:false,save(){writes++;return false;}};
  const port=createChapterBoundary({slot:start.slot,key,storage:{getItem:k=>k===key?raw:null},
   locks:{request:(_name,_options,fn)=>fn()},normalize,hash:shaText,releasePin:id=>id===to?start.pin:null,
   verifyOwner:()=>false,verifyCold:(a,w,id)=>a===app&&w===store&&id===to,
   verifyRelay54:r=>verifyStage54Relay(C,sill,r,true),verifyBridge:(id,r)=>validBrokenRailCrossing(rail,id,r),
   verifyEave:validTornEave,verifyThread:validSodanThread,verifyReturn:verifyReturnGate,
   verifyD:(u,r,options)=>verifyHallD56(C,slice,u,r,options),legacyD:legacyHallExit56,
   ownedStore:(a,w)=>a===app&&w===store,originalProfile:()=>base});
  function select(body){raw=JSON.stringify({...base,honroAct6ChapterBoundary:{body,sha:sha(body)}});return raw;}
  const flags=Object.keys(start.terminal.flags);
  for(const flag of flags){
   const missing=clone(start);
   delete missing.terminal.flags[flag];
   missing.terminalSHA=sha(missing.terminal);
   const held=select(missing);
   assert.deepEqual(port.inspect(app),{kind:'invalid'},`${to} missing ${flag}`);
   const bad=await port.restore({app,store,to,pin:start.pin,enter:()=>{mounts++;return true;}});
   assert.equal(bad.reason,'checkpoint-integrity-or-revision',`${to} missing ${flag}`);
   assert.equal(raw,held);
  }
  const held=select(start);
  assert.deepEqual(port.inspect(app),{kind:'restorable',to},`${to} fixture compatibility`);
  const good=await port.restore({app,store,to,pin:start.pin,enter:(body,still)=>{
   mounts++;
   return still()&&body.from===to-1&&body.to===to;
  }});
  assert(good.ok,`${to} ${JSON.stringify(good)}`);
  assert.equal(mounts,1);assert.equal(writes,0);assert.equal(raw,held);assert.equal(JSON.stringify(fixture),sourceJSON);
  results[to]={from:to-1,fixture:'tracked historical source',sourcePacket:start.pin.fromPacket,fixtureEnvelopeSHA:good.sha,
   readOnlySHA:shaText(held),verifiedFlags:flags,deniedMissingFlags:flags.length,originalBytesPreserved:true};
 }
 stateChecks.boundaryRecipes=results;
}

async function testSodanThread(){
 const skill=Object.fromEntries(sodanInnerTree.map(id=>[id,C.SKILLS[id]]));
 assert(sodanInnerTree.every(id=>skill[id]?.cls==='occultist'&&!skill[id].passive&&C.TALENT_MAP[id].branch===1));
 const from=rawProfile(53),p=await pack(59),c=compiled(p);
 const body=clone(fixtures[53].body.custody.full.occultist);
 Object.assign(body,{focus:100,maxFocus:100,ranks:{...body.ranks,O06:1,O07:1,O08:1,O09:1,O10:1}});
 const original=clone(body),m=clone(fixtures[53].body.custody.full.mage);
 const foe=C.makeUnit('knight',1,m.x+230,m.y,{id:'thread-proof-foe',hp:200});
 const {e,b}=carrier(53,p,c,from,[m,foe],'act6-native-53');
 // Use the authored upper landing as the actual grounding of the caster. A
 // deterministic shot prediction isolates skill/rank/cost from AI and aim.
 const t=b.terrain.find(q=>q.id===near59);
 const x=1000*K;
 foot(e,m,x,t.id);foot(e,foe,x-95,t.id);
 const old=e.predict;e.predict=()=>({unit:foe.id});
 const s=mountSodanSpirit({C,e,scene:{unitBody(){}},hero:m,body,stage:53});
 assert.deepEqual(s.skills(),sodanInnerTree);
 assert(!s.cast('O13'));assert(s.cast('O07'),'native O07 support launch');
 e.predict=old;
 const record=s.record(),cast=record.casts[0];
 assert.equal(cast.skill,'O07');assert(cast.cost>0&&s.used()&&!s.cast('O06'));
 assert(b.projectiles.some(p=>p.skill==='O07'&&p.owner===body.id));
 assert.equal(e.active,m);assert.deepEqual(body,original);
 assert(validSodanThread(record,body,53));
 assert(validSodanThread({...record,casts:[{...cast,skill:'O06'}]},body,53));
 assert(!validSodanThread({...record,casts:[{...cast,skill:'O13'}]},body,53));
 assert(debitSodanThread(body,record,53,0));assert.equal(body.focus,100-cast.cost);
 const mage2=clone(m), guard=C.makeUnit('knight',1,x-90,m.y,{id:'mumyeongsa-b-wall-guard',hp:300});
 const foe2=C.makeUnit('knight',1,x+80,m.y,{id:'thread-charm-foe',hp:200});
 const second=carrier(54,p,c,from,[mage2,guard,foe2],'act6-gallery-charts');
 foot(second.e,mage2,x,t.id);foot(second.e,guard,x-90,t.id);foot(second.e,foe2,x+80,t.id);
 const choice=mountSodanSpirit({C,e:second.e,scene:{unitBody(){}},hero:mage2,body:original,stage:54});
 second.e.predict=()=>({unit:guard.id});
 assert(!choice.cast('O09')&&!choice.used(),'scripted wall guard excluded from aim');
 second.e.predict=()=>({unit:foe2.id});assert(choice.cast('O09'));
 const bolt=second.b.projectiles.find(p=>p.skill==='O09');
 assert(bolt); const spirit=second.e.unit(original.id);
 assert.equal(second.e.captureEnemy(guard,spirit,1),false,'scripted wall guard protected at impact too');
 second.e.impact(bolt,{x:foe2.x,y:foe2.y-30,unit:foe2});
 assert(foe2.enthrall&&foe2.side===0&&guard.side===1,'normal eligible enemy is temporarily enthralled');
 stateChecks.sodan={learnedTree:s.skills(),cast:cast.skill,retainedOriginalParty:true,cost:cast.cost};
}

async function testSodanGroundImpact(){
 const profile=rawProfile(53),p=await pack(59),c=compiled(p);
 const from=fixtures[53].body.custody.full,x=1000*K;
 for(const skill of ['O08','O10']){
  let exercised=false;
  for(const distance of [290,390,470,600,720]){
   const m=clone(from.mage),body={...clone(from.occultist),focus:500,maxFocus:500,ranks:{O08:3,O10:3}};
   const foe=C.makeUnit('knight',1,x+distance,0,{id:'area-curse-check',hp:1200,maxHp:1200});
   const {e,b}=carrier(53,p,c,profile,[m,foe],'act6-native-53');
   foot(e,m,x,near59);foot(e,foe,x+distance,near59);m.facing=1;
   const support=mountSodanSpirit({C,e,scene:{unitBody(){}},hero:m,body,stage:53});
   const predict=e.predict.bind(e);
   // Do not invent a trajectory. Choose only real terrain predictions so this
   // tests the newly allowed outcome, not a successful direct hit.
   e.predict=(...args)=>{const result=predict(...args);return result.terrain&&!result.unit?result:{points:[]};};
   if(!support.cast(skill))continue;
   const projectile=b.projectiles.find(p=>p.skill===skill);
   const native=e.impact.bind(e),observed=[];
   e.impact=(p,h)=>{if(p===projectile)observed.push(h);return native(p,h);};
   for(let i=0;i<2400&&b.projectiles.includes(projectile);i++)e.stepProjectile(projectile,1/120);
   assert(observed[0]?.terrain&&!observed[0]?.unit,skill+' native ground impact');
   if(skill==='O08')assert(foe.manifestedUntil>=b.round,'native reveal');
   else assert(foe.earthbind?.owner===body.id,'native earthbind');
   assert(!support.cast(skill)&&support.record().casts.length===1);
   const before=body.focus;assert(debitSodanThread(body,support.record(),53,0)&&body.focus<before);
   exercised=true;break;
  }
  assert(exercised,skill+' needs a real ground-only trajectory');
 }
}

async function testFirstMissions(){
 const profile=rawProfile(52),results={};
 let previous;
 for(const id of [51,52]){
  const packet=intake.rows[id],p=await pack(id),c=compiled(p),rules={...packet.mission,runtimeReleaseEnabled:true};
  const units=clone(packet.owner.actors);
  if(id===51)units.find(u=>u.side===0&&u.cls==='mage').ranks=clone(profile.heroes.mage.ranks);
  if(previous)for(const u of units.filter(row=>row.side===0))Object.assign(u,previous.actors.find(row=>row.cls===u.cls));
  const {app,e,b}=carrier(id,p,c,profile,units,rules.objective);
  Object.assign(app.stage,{act:6,actStage:rules.actStage});
  const source={kind:'normal-owned-release',incoming:previous};
  const mission=createFirstMissionOwner({C,manifest:{rows:{[id]:rules}},verifyMounted:(a,E,s)=>a===app&&E===e&&s===source,fingerprint:sha});
  assert(mission.mount(app,e,source),`${id} native mission mount`);
  const interact=id=>mission.interact(app,e,id);
  const [first,bridge,bell,threshold]=rules.marks;
  const at=m=>actor(e,m.cls,m.x,m.support);
  const allAt=(m)=>players(b).forEach((u,i)=>foot(e,u,m.x+i*22,m.support));
  const r={};
  at(first);assert(!interact('threshold').ok);assert(!interact(first.id).ok);
  if(id===51){
   const champion=e.unit('crest-champion');hurt(e,champion,1000000);
   assert(champion.dead&&!interact(first.id).ok,'still need the four grounded originals');
   allAt(first);at(first);assert(interact(first.id).ok);
  }else{
   const stone=e.unit('cliff-stone'),start=stone.hp;
   for(let i=0;i<7&&!stone.dead;i++)shot59(e,'archer','A01',stone.x,stone.y-stone.h*.65,first.x,first.support);
   r.cliffHP=[start,stone.hp];assert(stone.dead,'archer shot must kill the real stone');
   at(first);assert(interact(first.id).ok);
   at(bridge);assert(!interact(bridge.id).ok);
   const keeper=e.unit(bridge.afterEnemy);hurt(e,keeper,1000000);assert(keeper.dead);
   at(bridge);assert(interact(bridge.id).ok);
   at(threshold);assert(!interact(threshold.id).ok);
   at(bell);assert(interact(bell.id).ok);
   at(threshold);assert(!interact(threshold.id).ok);
   assert.equal(mission.thresholdParty(app,e),null);
   allAt(bell);at(threshold);
   const actors=mission.thresholdParty(app,e);
   assert.equal(actors?.length,4);
   const mage=actors.find(u=>u.cls==='mage'),profileBefore=JSON.stringify(profile),before=clone(mage);
   const draft=Object.fromEntries(actors.map(u=>[u.cls,{skills:[1,2,3].map(i=>u.loadout[i]??''),
    gear:['personal','common'].map(slot=>u.equipmentIds?.find(id=>C.EQUIPMENT_MAP[id].slot===slot)??'')}]));
   assert.deepEqual(planThresholdPrep(C,profile,actors,draft),[]);
   const invalid=clone(draft);invalid.mage.skills[0]='UNLEARNED';
   assert.equal(planThresholdPrep(C,profile,actors,invalid),null);
   assert.equal(mission.interact(app,e,threshold.id,()=>null).ok,false);
   assert.deepEqual(mage,before);assert.equal(mission.project(app,e).complete,false);
   draft.mage.skills=['M07','M10',''];
   draft.mage.gear[0]='itm_da_02';
   assert(mission.interact(app,e,threshold.id,party=>planThresholdPrep(C,profile,party,draft)).ok);
   assert.deepEqual(mage.loadout,['M01','M07','M10','']);
   assert(mage.equipmentIds.includes('itm_da_02'));
   assert(mage.hp<=before.hp&&mage.focus<=before.focus);
   assert.deepEqual(mage.equipmentState,before.equipmentState);
   assert.equal(JSON.stringify(profile),profileBefore);
   assert.equal(mission.thresholdParty(app,e),null);
   r.prep={loadout:mage.loadout,equipment:mage.equipmentIds,noRefill:true,noProfileMutation:true};
  }
  assert.equal(mission.project(app,e).complete,true);
  b.phase='lost';assert.equal(mission.terminal(app,e),null);
  b.phase='won';previous=mission.terminal(app,e);
  assert.equal(previous.stage,id);assert.equal(mission.terminal(app,e),null);
  assert.deepEqual(Object.keys(previous.flags),rules.terminalFlags);
  if(r.prep)assert.deepEqual(previous.actors.find(u=>u.cls==='mage').loadout,r.prep.loadout);
  r.events=previous.events.map(v=>v.key);r.flags=previous.flags;r.noLossTerminal=true;
  results[id]=r;
 }
 Object.assign(stateChecks,results);
}
async function test57(){
 const h=await make57(),{e,b,app,owner}=h;
 const guard=rescue57(h);
 assert(e.unit(body57)?.hp>0&&owner.interact('reuniteAtWard').ok);
 assert(!e.unit(body57)&&e.unit('p-mage')?.side===0&&guard.side===2);
 assert(b.terrain.some(t=>t.id==='local-07-08-exact-receiving-slice'));
 assert(!owner.project().complete);
 const feet={archer:5872,mage:5992,knight:6090,occultist:6200};
 for(const u of players(b))foot(e,u,feet[u.cls],'local-07-08-exact-receiving-slice');
 owner.tick();assert(owner.project().complete);
 b.phase='won';app.done=true;
 const result=owner.terminal();assert(result&&result.body.length===4&&result.guard.ref===guard.id);
 const terminal=make57Boundary(result,e);
 const slice=h.p.bridge.additions.terrain.find(t=>t.id==='local-07-08-exact-receiving-slice');
 let state=sealPort(app,57,{terminal,slice});
 assert.equal(state.port.inspect(app).kind,'restorable','57 source fixture must be readable');
 const outgoing=await state.port.checkpoint({app,engine:e,store:state.store,terminal,to:58,
  pin:fixtures[58].body.pin,expectedRaw:state.raw(),stageSeed:app.stage,budget:{id:57}});
 assert(outgoing.ok,JSON.stringify(outgoing));
 assert.equal(state.writes(),1);assert.equal(JSON.parse(state.raw()).honroAct6ChapterBoundary.body.to,58);
 const c58=await make58(terminal);assert.equal(players(c58.b).length,4);

 const loss=await make57(), parked=loss.e.unit(body57),before=parked.hp;
 const lostApp=loss.app,state2=sealPort(lostApp,57,{owner:loss.owner,slice});
 const held=state2.raw(), pin=fixtures[57].body.pin;
 lostApp.engine=null;lostApp.screen='rest';
 const admission=await state2.port.restore({app:lostApp,store:state2.store,to:57,pin,enter:(row,stays)=>stays()&&row.to===57});
 assert(admission.ok,JSON.stringify(admission));
 const repeated=await state2.port.restore({app:lostApp,store:state2.store,to:57,pin,enter:()=>true});
 assert(!repeated.ok,'general same-session replay stays sealed');
 lostApp.engine=loss.e;lostApp.screen='battle';
 assert(!state2.port.permitFailed57Retry(lostApp,state2.store));
 hurt(loss.e,parked,100000,'p-archer');assert.equal(parked.hp,0);
 loss.owner.tick();
 assert(loss.owner.project().failed&&!loss.owner.project().complete&&loss.owner.terminal()===null);
 assert.match(loss.owner.project().summary,/담허의 육신/);
 assert(!loss.owner.interact('reuniteAtWard').ok);
 assert(!loss.b.terrain.some(t=>t.id==='local-07-08-exact-receiving-slice'));
 loss.b.phase='lost';lostApp.done=true;
 const denied=await state2.port.checkpoint({app:lostApp,engine:loss.e,store:state2.store,terminal:null,to:58,
  pin:fixtures[58].body.pin,expectedRaw:held,stageSeed:lostApp.stage,budget:{id:57}});
 assert(!denied.ok&&state2.raw()===held&&state2.writes()===0);
 assert(state2.port.permitFailed57Retry(lostApp,state2.store));
 lostApp.engine=null;lostApp.screen='rest';
 const retry=await state2.port.restore({app:lostApp,store:state2.store,to:57,pin,enter:async(row,stays)=>{
  if(!stays()||row.to!==57)return false;
  const replacement=await make57();
  assert.equal(replacement.e.unit(body57).hp,before);
  return stays();
 }});
 assert(retry.ok&&state2.raw()===held&&state2.writes()===0,JSON.stringify(retry));
 stateChecks[57]={casualty:[before,parked.hp],defeatReason:loss.owner.project().summary,blocked58:denied.reason,
  retry:retry.ok,unchangedSHA256:shaText(held),aliveReunion:result.body.map(r=>r.id),guard:result.guard.ref,
  next58:outgoing.ok,next58SourceSHA256:shaText(state.raw())};
}
async function make59(){
 const p=await pack(59),c=compiled(p),profile=rawProfile(59),body=fixtures[59].body;
 const original=clone(body.terminal),full=clone(body.custody.full);
 const prev={...original,crew:full,boundary:{full,guard:original.guard,association:original.association}};
 const adapter=stage59Adapter(G,{verifyPrevious:q=>q===prev,verifyNormal:(app,e)=>app.engine===e});
 const prep=await adapter.prepare({descriptor:STAGE59,packet:p,compiled:c,previous:prev});assert(prep,'59 prepared R custody');
 const h=carrier(59,p,c,profile,prep.units,STAGE59.objective);
 const owner=adapter.attach({app:h.app,engine:h.e,prepared:prep});assert(owner,'59 owner attach');
 return {...h,owner,p};
}
function shot59(e,cls,skill,x,y,roleX,site){
 const u=actor(e,cls,roleX,site);u.focus=u.maxFocus;u.facing=1;
 assert(e.fire(skill,75,.55),'native shot admitted '+skill);
 const p=e.b.projectiles.find(v=>v.owner===u.id&&v.skill===skill);
 assert(p,'native root projectile '+skill);
 Object.assign(p,{x,y:y-28,vx:0,vy:650});
 for(let i=0;i<25&&e.b.projectiles.includes(p);i++)e.stepProjectile(p,1/120);
}
function volley59(h,round){
 Object.assign(h.b,{side:0,phase:'aim',round,projectiles:[]});h.b.teamEnds[1]=round-1;
 h.owner.tick();
 assert(enemies(h.b).length<=FRONTS59.fieldCap,'field cap exceeded');
 h.e.refreshActivation();assert(h.e.combatEnemies().length<=FRONTS59.totalCap,'awake cap exceeded');
}
function guard59(h,which,round,x=958*K){
 actor(h.e,'knight',x,near59);
 return h.owner.defend(()=>{h.e.active.acted=true;h.b.turn++;});
}
async function test59(which){
 const h=await make59(),{e,b,app,owner}=h;
 const scene={battle:b,time:1,scale:1},draws=[];
 app.scene=scene;
 const renderer=attachStage59Forepaw({G:{HONRO_CORE:C,HonroVectorParts:{create:()=>({draw(_ctx,id){draws.push(id);}})}},
  app,e,scene,owner,owns:()=>true});assert(renderer);
 const ctx={globalAlpha:1,save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},translate(){},scale(){}};
 const cue=()=>{scene.time+=.03;scene.objectDamage(ctx,b);return renderer.read().last;};
 assert.equal(enemies(b).length,1);owner.tick();assert.equal(enemies(b).length,1+sentries59.length);
 const first=enemies(b).filter(u=>u.id.startsWith('finale-first-'));
 assert(first.some(u=>u.honroRigAsset==='wonhon_knotted')&&first.some(u=>u.honroRigAsset==='wonhon'));
 assert(first.some(u=>u.honroRigAsset==='gate_armor'&&u.h>=FRONTS59.bodies.warden.h*.8));
 assert(first.every(u=>C.validTerrainContactPose(b.terrain,u)));
 assert(!owner.interact('activateGarmjin').ok&&!owner.project().complete);
 actor(e,'knight',900*K,near59);owner.tick();
 assert(b.honroState.localReturnGuardAftermath?.poses.length===3);
 actor(e,'archer',462*K,high59);owner.tick();
 const bell=e.unit('qa-bell-shade');assert(bell);hurt(e,bell,100000,'p-occultist');owner.tick();
 actor(e,'occultist',1490*K,near59);assert(owner.interact('markSoulPath').ok);
 guard59(h,which,1);
 // Genuine stock shot and collision pipeline; fixture positions the already launched roots
 // at the scripted seats so this asserts the owner filters without simulating player aim.
 for(let round=1;round<=2;round++){
  volley59(h,round);
  shot59(e,'archer','A01',522*K,1871.8947026324342,462*K,high59);
  shot59(e,'mage','M01',1710*K,2291.3294746996403,1685*K,near59);
 }
 volley59(h,3);
 assert(owner.inspect().state.cliff&&owner.inspect().state.mage&&owner.inspect().state.soul&&owner.inspect().state.bridge,
  JSON.stringify(owner.inspect().state));
 let actualCaps=[],firstPulse=null,joined=null,maxAlive=0;
 const cues=[];
 for(let round=3;round<=34;round++){
  volley59(h,round);
  maxAlive=Math.max(maxAlive,enemies(b).length);
  const giant=e.unit('finale-giant-forepaw'),log=owner.inspect().log;
  if(giant&&!owner.inspect().state.forepaw){
   if(which==='guard'&&firstPulse)guard59(h,which,round);
   else if(which==='strike'&&firstPulse){actor(e,'archer',522*K,high59);hurt(e,giant,Math.max(80,giant.maxHp*.12),'p-archer');}
   if(live(giant)&&!owner.inspect().state.forepaw&&owner.inspect().giantSweep){
    const mark=cue();assert.equal(mark?.phase,'warning','actual forepaw warning has no renderer admission');
    cues.push(mark);
    enemyTurn(e,giant,()=>[...e.enemyActionSteps()]);
    Object.assign(b,{side:0,phase:'aim'});
    const released=cue();assert.equal(released?.phase,'release','the actual ground sweep must render a release');
    cues.push(released);
    const observed=owner.inspect().log.find(r=>r.kind==='giant-sweep-resolved');
    if(observed)firstPulse??=observed;
   }
  }
  volley59(h,round+1);
  actor(e,'occultist',1755*K,near59);
  if(owner.interact('activateGarmjin').ok){joined=owner.inspect().waves.rounds.filter(v=>v.action==='spawn').flatMap(v=>v.squadActors);break;}
  actor(e,'archer',522*K,high59);actor(e,'occultist',1490*K,near59);
  // Source test supplies resolved enemy turns and limited real damage. Keep the
  // bridge threat, forepaw and at least one enemy from each front in the scene.
  for(const prefix of ['finale-first-','finale-west-return-','finale-east-fault-']){
   const found=enemies(b).filter(u=>u.id.startsWith(prefix));
   for(const v of found.slice(0,prefix==='finale-first-'?3:Math.max(0,found.length-1)))hurt(e,v,100000,'p-archer');
  }
  e.refreshActivation();
  Object.assign(b,{active:'p-archer',side:0,phase:'aim',queue:players(b).map(u=>u.id),projectiles:[]});
  e.switchTeam();
  if(b.side===1){assert(b.queue.length<=FRONTS59.attackCap);actualCaps.push(b.queue.length);}
 }
 assert(firstPulse,'large forepaw never presented a valid sweep state');
 assert(draws.length>=2&&renderer.detach());
 assert(owner.inspect().state.forepaw===which,'wrong forepaw response '+JSON.stringify(owner.inspect().state));
 assert(joined?.length>=28,'the legal closing formation admitted only '+joined?.length);
 assert.deepEqual(new Set(owner.inspect().waves.rounds.filter(v=>v.action==='spawn').map(v=>v.front)),new Set(['west-return','east-fault']));
 const beforeClosed=owner.inspect().waves.rounds.filter(v=>v.action==='spawn').length;
 assert(owner.inspect().waves.closed,'garmjin must close both wings immediately');
 const closedRound=b.round;
 for(let future=1;future<=14;future++)volley59(h,closedRound+future);
 const afterClosed=owner.inspect().waves.rounds.filter(v=>v.action==='spawn').length;
 assert.equal(afterClosed,beforeClosed,'garmjin closes inflow immediately');
 assert(!owner.project().complete);
 const bridge=e.unit('qa-immediate-bridge-threat');assert(bridge&&enemies(b).length>=1);
 if(which==='guard')hurt(e,bridge,100000,'p-archer');
 else {
  actor(e,'knight',bridge.x-78,near59);
  e.hurt(bridge,Math.max(16,bridge.maxHp*.08),'p-knight',true,undefined,{x:bridge.x,y:bridge.y-42},'normal','S00');
  const retreat=owner.inspect().log.find(v=>v.kind==='bridge-retreat-signaled');assert(retreat);
  Object.assign(b,{side:1,phase:'enemy',active:bridge.id,queue:[bridge.id]});
  for(let t=0;t<147&&!owner.project().complete;t++){
   bridge.moveLeft=Math.max(bridge.moveLeft,24);e.tick(1/120);
  }
  Object.assign(b,{side:0,phase:'aim',active:'p-knight',projectiles:[]});
 }
 const landing=e.unit('p-knight');
 Object.assign(landing,{airborne:true,vy:-60});
 owner.tick();assert(!owner.project().complete&&owner.terminal()===null,'59 cannot record a retreat with one original airborne');
 for(const [cls,x,support] of [['archer',522,high59],['knight',958,near59],['mage',1710,near59],['occultist',1755,near59]])actor(e,cls,x*K,support);
 owner.tick();
 assert(owner.project().complete,'last bridge threat has not resolved '+JSON.stringify(owner.inspect().state));
 b.phase='won';app.done=true;
 const terminal=owner.terminal();assert(terminal&&owner.boundaryProof(terminal)?.closed);
 const state=sealPort(app,59,{terminal}),physical=owner.boundaryProof(terminal),prior=state.raw();
 assert.equal(state.port.inspect(app).kind,'restorable','59 source fixture must be readable');
 assert(players(b).every(u=>e.grounded(u)),'59 saved bodies must be on their physical feet');
 const signed=await state.port.checkpoint({app,engine:e,store:state.store,terminal,physical,to:60,pin:fixtures[60].body.pin,
  expectedRaw:prior,stageSeed:app.stage,budget:{id:59}});
 assert(signed.ok&&state.writes()===1,JSON.stringify(signed));
 const nativeSweeps=owner.inspect().log.filter(r=>r.kind==='giant-sweep-resolved');
 if(which==='guard')assert.deepEqual(nativeSweeps.map(v=>v.direction),[-1,1]);
 assert(firstPulse.hits.some(v=>v.before[0]>v.after[0]||v.before[1]>v.after[1]));
 const modeledTotal=sentries59.length+1+3+joined.length;
 stateChecks['59-'+which]={opening:sentries59.length+1,conditionalEnemies:modeledTotal,
   west:joined.filter(x=>x.id.includes('west-return')).length,east:joined.filter(x=>x.id.includes('east-fault')).length,
   maxAlive,peakAttackQueue:Math.max(0,...actualCaps),reinforcementsAfterSeal:afterClosed-beforeClosed,closedScheduleProbes:14,
   forepaw:nativeSweeps,cues,events:owner.inspect().log.map(r=>r.kind),next:terminal.next,
   signed60:shaText(state.raw())};
 const lost=await make59(),sodan=lost.e.unit('p-occultist');
 lost.owner.tick();hurt(lost.e,sodan,100000,'qa-immediate-bridge-threat');
 lost.owner.tick();assert(lost.owner.project().failed&&!lost.owner.project().complete&&lost.owner.terminal()===null&&lost.owner.inspect().waves.closed);
 assert.match(lost.owner.project().summary,/소단/);
 const protectedSave=sealPort(lost.app,59),content=protectedSave.raw();
 lost.b.phase='lost';lost.app.done=true;
 const denied=await protectedSave.port.checkpoint({app:lost.app,engine:lost.e,store:protectedSave.store,terminal:null,to:60,
  pin:fixtures[60].body.pin,expectedRaw:content,stageSeed:lost.app.stage,budget:{id:59}});
 assert(!denied.ok&&protectedSave.writes()===0&&protectedSave.raw()===content);
 stateChecks['59-'+which].loss={blocked60:denied.reason,originalSHA256:shaText(content),reason:lost.owner.project().summary};
 return {terminal,physical};
}

async function test60(incoming){
 const p=await pack(60),c=compiled(p),profile=rawProfile(60),terminal=incoming.terminal;
 const crew=p.quiet.start.map(seat=>{
  const u=clone(terminal.actors.find(v=>v.cls===seat.cls));assert(u);
  return Object.assign(u,{x:seat.x,y:seat.y,spawnX:seat.x,spawnY:seat.y,vx:0,vy:0,jumping:false,airborne:false,acted:false,moveLeft:u.maxMove});
 });
 const h=carrier(60,p,c,profile,crew,'act6-quiet-exit'),{e,b,app}=h;
 const {createFixedWriter}=await import('../shared/act6-normal-ending-qa/writer-fixed.mjs');
 const code=(await readFile(new URL('../shared/runtime/stage60-owner.mjs',import.meta.url),'utf8'))
  .replace(/^import .*?;$/gm,'').replace('export function createStage60Owner','function createStage60Owner');
 const createStage60Owner=new Function('prepareEnding','endingCardFor',code+'\nreturn createStage60Owner;')(prepareEnding,endingCardFor);
 const lines=incoming.physical.guardAftermath.poses.map(x=>({actorId:x.id,name:{'local-07-gwakjin-return-keeper':'곽진','local-07-return-guard-shield':'박문돌','local-07-return-guard-relay':'이만복'}[x.id],event:incoming.physical.guardAftermath.source}));
 const rawSHA=sha(terminal),key='act6-ending:'+profile.equipment.runId+':'+rawSHA;
 const previous60={flags:{'act6.garmjinCompleted':true,finalThreatResolved:true},body:terminal.actors,rawSHA,endingKey:key};
 const floor=b.terrain.find(q=>q.id===p.quiet.support);
 const gate=[p.quiet.gate,C.topAt(floor,p.quiet.gate)],dest=p.quiet.souls.map(q=>q.to),t0={},frame={};
 const source=JSON.stringify(profile);let finale=source,writes=0;
 const saveApp={normalProfile:clone(profile),profileStore:{locked:false,save(v){writes++;finale=JSON.stringify(v);return true;}}};
 saveApp.profile=saveApp.normalProfile;
 const seal={key,terminalSha:rawSHA,knight:'p-knight',runId:profile.equipment.runId,actorIds:lines.map(v=>v.actorId),names:lines.map(v=>v.name)};
 const writer=createFixedWriter({app:saveApp,seal,authorize:(t,a)=>t===seal&&a===saveApp,frame,
  readCurrentExact:()=>finale,normalize:JSON.parse,runExclusive:fn=>fn()});
 const mount=createStage60Owner({C,authorize:lease=>lease?.engine===e&&lease?.app===app,
  authorizeFrame:(_lease,proof)=>proof===frame,worldFor:()=>({battle:b,floor:floor.id,readyFlag:'localAct6QuietExitVerified',
   dest,destY:dest.map(x=>C.topAt(floor,x)),gate,gateRadius:[182,150],y:x=>C.topAt(floor,x),acceptTick:(clock,E)=>clock===t0&&E===e}),
  createSouls:()=>p.quiet.souls.map(v=>G.HonroUnits.create({id:v.id,kind:'ghost',team:'npc',x:v.from,y:C.topAt(floor,v.from),label:v.label,
   stageOverrides:{fixed:false,loadout:[]}},b,app.profile,G.HONRO_CONTENT.stages[0])),
  endingWriter:()=>writer,namesFor:r=>r===previous60?{gwakjin:lines[0],guardWitnesses:lines.slice(1)}:null});
 const owner=mount.mount({app,engine:e,packet:p,scope:'normal-private-stage60',previous:previous60});
 assert(owner,'60 exact successor of the normal 59 owner');
 const souls=b.units.filter(u=>u.side===2),start=souls.map(u=>u.x);
 assert.equal(souls.length,2);assert.equal(enemies(b).length,0);assert.equal(b.shot,0);
 assert(souls.every(u=>!u.loadout.length&&crew.every(a=>!e.attackAllows(u,a.id))));
 assert(!owner.nativeGuide(1/120,t0)&&owner.nativePosition()===null);
 actor(e,'archer',5360,floor.id);assert(!owner.nativeInteraction('guide'));
 actor(e,'occultist',5360,floor.id);assert(owner.nativeInteraction('guide'));
 for(let i=0;i<1200&&souls.some((u,j)=>u.x<dest[j]-9);i++){
  actor(e,'occultist',souls[0].x+64,floor.id);
  owner.nativeGuide(1/120,t0);
 }
 assert(souls.every((u,i)=>u.x>=dest[i]-9&&u.x-start[i]>300&&e.grounded(u)));
 assert(owner.nativePosition()===null,'souls alone cannot certify the ending');
 const positions={archer:6810,knight:6910,occultist:6860,mage:6964};
 for(const u of crew)foot(e,u,positions[u.cls],floor.id);
 const ready=owner.nativePosition();assert(ready?.souls.length===2&&b.shot===0,JSON.stringify({gate,phase:b.phase,
  crew:crew.map(u=>[u.id,u.x,u.y,e.grounded(u)]),souls:souls.map((u,i)=>[u.id,u.x,u.y,dest[i],C.topAt(floor,dest[i]),e.grounded(u),e.contactSurface(u.x,u.y-4,u.y+5)?.t.id])}));
 b.phase='won';app.done=true;
 assert(owner.settlement(ready)?.['act6.endingStarted']===true&&owner.settlement(ready)===null);
 assert((await owner.advanceScene('last-souls')).ok);
 assert(!(await owner.advanceScene('bridge-record')).ok,'memorial has a real actor constraint');
 assert(!owner.nativeInteraction('name-the-bridge-guard',e.unit('p-archer')));
 assert(owner.nativeInteraction('name-the-bridge-guard',e.unit('p-knight')));
 assert((await owner.advanceScene('bridge-record')).ok);
 assert((await owner.advanceScene('daybreak')).ok);
 assert(!(await owner.advanceScene('later-return')).ok);
 assert(!owner.acceptFinalFrame({})&&owner.acceptFinalFrame(frame));
 const commit=await owner.advanceScene('later-return');
 assert(commit.ok&&commit.done&&writes===1&&JSON.parse(finale).honroFlags['act6.endingCompleted']);
 assert.equal(JSON.stringify(app.profile),source);

 // The release title handoff is the real completion callback, driven with a
 // presentation double. The real timeline's render and duration are out of scope.
 const hostCode=await readFile(new URL('../shared/act6-ending-replan/native-host.inc.js',import.meta.url),'utf8');
 let returnToTitle;
 app.showTitle=()=>{app.screen='title';};app.updateAudio=()=>{};
 const root={isConnected:true},canvas={isConnected:true,width:1280,height:900};
 app.scene={canvas};
 const host=new Function('G','act6EndingReplan',hostCode+'\nreturn createEndingDOMDirect;')({},{
  open:(a,mode,fn)=>{assert(a===app&&mode==='completion');returnToTitle=fn;return {root,close(){}};},
  intro(){},
 })({authorize:()=>b.phase==='won',container:()=>({querySelector:()=>canvas}),writeFinal:writer});
 host.mountEnding(app,e,{},{});assert.equal(app.screen,'battle');
 returnToTitle();assert.equal(app.screen,'title');
 stateChecks[60]={attackers:enemies(b).length,shots:b.shot,souls:ready.souls,memorial:seal.names,
  receipt:JSON.parse(finale).honroEndingReceipt,ordinaryProfileUnchanged:true,title:app.screen};
}
async function testBellSiege(blocked=false){
 const p=await pack(55),c=compiled(p),profile=rawProfile(55),prior=previous(55);
 const units=[
  ...p.slots.map(([cls,x,y])=>C.makeUnit(cls,0,x,y,{...prior.external[cls],x,y,acted:false,airborne:false})),
  ...p.foes.map(({origin,...u})=>C.makeUnit(u.cls,1,u.x,u.y,u)),
 ];
 const h=carrier(55,p,c,profile,units,STAGE55.objective),{e,b,app,notices}=h;
 b.honroGrowth={limit:{total:0,combat:0}};app.stage={...app.stage,act:6,actStage:5};
 const source={};
 const owner=await createStage55EmptyBell({C,packet:{terrain:c.terrain,world:c.worldTerrain},
  verifyMounted:(a,j,v)=>a===app&&j===e&&v===source,verifyIncoming:()=>prior,verifyRelay:r=>r===prior.relay,
  verifyImpact:()=>false});
 assert(owner.mount(app,e,source),'normal 55 owner');
 const exterior=installExteriorEncounters(app,e,undefined,undefined,G,{siegeOpen:()=>owner.reinforcementsOpen(app,e)});
 const issued=()=>b.units.filter(u=>u.honroSpawnSource?.startsWith('bell-siege-'));
 const support=STAGE55.bell.support,knight=players(b).find(u=>u.cls==='knight');
 const drive=(round,x,site)=>{
  b.round=round;actor(e,'knight',x,site);e.refreshActivation();
  // Advance real encounter clock after a settled approach; no simulated damage or impact to trigger waves.
  for(let i=0;i<150;i++)exterior.tick(1/60);
 };
 if(blocked){
  foot(e,players(b).find(u=>u.cls==='archer'),771,'west-ring-descent');
  drive(2,550,'west-ring-descent');assert.equal(issued().length,0,'both west seats are occupied');
  drive(4,2500,support);
  assert.equal(issued().length,2,'a blocked west approach cannot starve the east attack');
  assert(issued().every(u=>u.honroSpawnSource==='bell-siege-lip'&&e.grounded(u)));
  return;
 }
 drive(1,550,'west-ring-descent');assert.equal(issued().length,0);
 drive(2,550,'west-ring-descent');assert.equal(issued().length,2);
 assert(issued().every(u=>u.honroEncounterSupport==='west-ring-descent'&&u.facing===1&&u.awake&&e.grounded(u)));
 drive(3,587,'west-ring-descent');assert.equal(issued().length,2);
 drive(4,2500,support);assert.equal(issued().length,4,JSON.stringify({notices,units:enemies(b).map(u=>[u.id,u.x,u.y,u.awake])}));
 assert(issued().slice(2).every(u=>u.x>knight.x&&u.honroEncounterSupport===support&&u.awake&&e.grounded(u)));
 drive(6,2500,support);assert.equal(issued().length,4,'living wave cap avoids stacking');
 let u=issued()[0];u.hp=0;u.dead=true;
 drive(7,2500,support);assert.equal(issued().length,5,'a cleared slot admits the waiting wave');
 assert.equal(notices.filter(l=>l===ACT6_EXTERIOR_ENCOUNTERS[55].siege[2].label).length,1);
 // Real owner actions and exact grounded contact; enemy defeat is supplied, not full manual play.
 const arrived=actor(e,'knight',2612,support);
 assert.equal(arrived,knight);assert(owner.interact(app,e,'reach-bell').ok);
 const gate=e.unit(STAGE55.gate.id);gate.hp=0;gate.dead=true;
 assert(owner.interact(app,e,'align-bell').ok,'actual empty seat alignment');
 assert(owner.project(app,e).complete&&owner.project(app,e).optionalEnemiesRemain>0);
 u=issued()[1];u.hp=0;u.dead=true;
 drive(8,2500,support);assert.equal(issued().length,5,'no new assault after actual alignment');
 assert.equal(b.enemyLimit,7);
 stateChecks[55]={spawned:issued().map(u=>[u.id,u.honroEncounterSupport]),stopOnAlignment:true,maxOptionalWaveAlive:4};
}
const targets={
 51:[7,9,16,22,8,5],52:[8,10,18,24,9,6],53:[5,7,12,17,6,4],54:[4,6,13,18,6,4],
 55:[8,11,24,32,10,7],56:[5,7,14,19,7,5],57:[7,10,18,26,9,6],58:[4,6,16,23,9,6],
 59:[10,14,34,50,14,8],60:[0,0,0,0,0,0],
};
const roleFor={hound:'ground advance / HBM01',shade:'range pressure / HSH01–02',stag:'front control / HBM03'};
const stockOriginals={
 51:{initial:4,roles:['watcher','pocket','armor','crest-champion'],conditions:[]},
 52:{initial:3,roles:['watch-range','bridge-keeper','return-guard'],conditions:[],exclude:['cliff-stone']},
 53:{initial:2,roles:['draft-lower-lane-guard','draft-upper-side-guard'],conditions:[]},
 54:{initial:1+company54.length,roles:['mumyeongsa-b-wall-guard',...company54.map(([id])=>'mumyeongsa-b-'+id)],
  conditions:[],phase:'B wall entry. The gallery starts after this company leaves.'},
 55:{initial:4,roles:['draft-pressure-0','draft-pressure-1','draft-pressure-2','draft-pressure-3'],conditions:[]},
 56:{initial:3,roles:['draft-pressure-0','draft-pressure-1','draft-pressure-2'],conditions:[['draft-pressure-3','real reversal after the second stake']]},
 57:{initial:2,roles:['a6-c07-optional-drift','a6-c07-ward-pressure'],conditions:[['a6-c07-optional-pressure','grounded railing collapse']],exclude:[body57,'local-07-gwakjin-return-keeper']},
 58:{initial:0,roles:[],conditions:[['a6-c08-boss','two grounded rites'],['a6-c08-vessel-a','threshold manifestation'],['a6-c08-vessel-b','threshold manifestation'],
  ['a6-c08-ink-echo-a','phase 3'],['a6-c08-ink-echo-b','phase 3']],exclude:['a6-c08-expansion-node','a6-c08-unsettled-ledger','a6-c08-margin-echo']},
};
function poseCandidate(e,row,plan,profile){
 const [role,site,x,hint,fixed=false,,heightAbove=0]=row,support=plan.sites[site];
 const host=e.b.terrain.find(t=>t.id===support&&x>=t.x&&x<=t.x+t.w);
 const y=host?C.topAt(host,x,hint):NaN;
 const face=e.contactSurface(x,y-3,y+4);
 if(!face||face.t.id!==support||Math.abs(face.y-y)>.25||y<0||y>e.b.height)return {role,site,support,x,hint,y,legal:false};
 const unit=G.HonroUnits.create({id:'declared-geometry-probe',kind:role,team:'enemy',behavior:'aggressive',x,y:y-heightAbove,facing:-1},
  {mode:'campaign',honroStage:50,honroMapOrigin:'campaign',honroCanonical:true},profile,G.HONRO_CONTENT.stages[49]);
 return {role,site,support,x,y,fixed,loadout:unit?.loadout??[],legal:!!unit?.loadout.length&&(heightAbove?C.flyingEnemy(unit)&&C.flightClear(e,unit,unit):C.validTerrainContactPose(e.b.terrain,unit))};
}
async function auditRosters(){
 const {composeHall53}=await import('../shared/act6-mumyeongsa/stage53.mjs');
 const {composeGallery54}=await import('../shared/act6-mumyeongsa/stage54.mjs');
 const {createBrokenRail}=await import('../shared/act6-mumyeongsa/broken-rail.mjs');
 const raw53=await read('shared/data/act6-qa/third.json');
 const B=createBrokenRail(await read('shared/act6-b-slice/layout.json'));
 const bedrock=await read('shared/act6-mumyeongsa/art/stage53-bedrock.json');
 const failures=[];
 for(const [key,plan] of Object.entries(ACT6_EXTERIOR_ENCOUNTERS)){
  const id=+key,base=await pack(id);
  const p=id===53?composeHall53(JSON.parse(raw53.mapText),JSON.parse(raw53.libraryText),B,bedrock):
    id===54?composeGallery54(base.map,base.library):base;
  const c=compiled(p);
  if(id===58)c.terrain=[...c.terrain,...hallB58().terrain.map(x=>G.HonroGeometry.terrain(x,p.map.height))];
  const profile=rawProfile(52),e=carrier(id,p,c,profile,[C.makeUnit('archer',0,500,0,{id:'probe-player'})],'state-audit').e;
  const field=r=>(Array.isArray(r[0])?r:[r]).map(row=>poseCandidate(e,row,plan,profile));
  const initial=plan.initial.map(field);
  const groups=plan.waves.map(w=>({id:w.id,approach:w.at,phase:w.phase??null,slots:w.units.map(field)}));
  const siege=(plan.siege??[]).map(w=>({id:w.id,round:w.round,slots:w.units.map(field)}));
  for(const [i,slot] of initial.entries())if(!slot.some(q=>q.legal))failures.push([id,'initial',i+1,slot]);
  for(const wave of [...groups,...siege])for(const [i,slot] of wave.slots.entries())if(!slot.some(q=>q.legal))failures.push([id,wave.id,i+1,slot]);
  const fixed=stockOriginals[id],generated=initial.length+[...groups,...siege].reduce((sum,w)=>sum+w.slots.length,0);
  const bossGrotesques=id===58?BOSS58.grot.total:0;
  const legalized=xs=>xs.filter(v=>v.some(c=>c.legal)).length;
  ledger[id]={target:targets[id],opening:fixed.initial+(id===54?0:initial.length),openingGallery:id===54?initial.length:undefined,
   declared:fixed.initial+fixed.conditions.length+generated+bossGrotesques,
   physicallyAssigned:fixed.initial+fixed.conditions.length+legalized(initial)+[...groups,...siege].reduce((n,w)=>n+legalized(w.slots),0)+bossGrotesques,
   active:plan.active,attackQueue:plan.attacks,stock:fixed,phaseApprovedGrotesques:bossGrotesques,
   groundFronts:plan.groundFronts??{},initial,groups,...(siege.length?{siege}:{})};
  assert.deepEqual([plan.active,plan.attacks],targets[id].slice(4));
 }
 const p=await pack(59),c=compiled(p),profile=rawProfile(59),e=carrier(59,p,c,profile,[C.makeUnit('archer',0,500,0,{id:'probe-player'})],'state-audit').e;
 const keys={near:near59,high:high59},plans=[];
 for(const f of FRONTS59.fronts){
  const rows=f.squads.map((squad,i)=>squad.map(([name,kind,seat,side])=>{
   const t=c.terrain.find(v=>v.id===keys[side]);
   const checks=[0,-f.dir*27,f.dir*27,-f.dir*58,f.dir*58].flatMap(step=>{
    const x=(seat+step)*K,y=C.topAt(t,x);
    if(x<=t.x+36||x>=t.x+t.w-36||e.contactSurface(x,y-4,y+5)?.t.id!==t.id)return [];
    const u=G.HonroUnits.create({id:'geometry-probe',kind,team:'enemy',behavior:'aggressive',x,y,facing:-1},
     {mode:'campaign',honroStage:50,honroMapOrigin:'campaign',honroCanonical:true},profile,G.HONRO_CONTENT.stages[49]);
    if(!u?.loadout.length||!C.validTerrainContactPose(c.terrain,u))return [];
    return [{x,y,loadout:u.loadout}];
   });
   if(!checks.length)failures.push([59,f.id,i+1,name,kind,side,seat]);
   return {name,kind,support:t.id,seats:checks};
  }));
  plans.push({front:f.id,physicalDirection:f.dir,announcedAfter:f.offset,squads:rows});
 }
 const parts=plans.map(f=>f.squads.map(s=>s.length));
 const scripted=3;
 ledger[59]={target:targets[59],opening:1+sentries59.length,initialBridgeOnly:1,scripted,
  declared:1+sentries59.length+scripted+parts.flat().reduce((n,k)=>n+k,0),
  requiredFormation:1+sentries59.length+scripted+parts.flatMap(groups=>groups.slice(0,FRONTS59.anchorGroups)).reduce((n,k)=>n+k,0),
  active:FRONTS59.totalCap,attackQueue:FRONTS59.attackCap,sentries:sentries59,groups:plans};
 assert.equal(ledger[59].declared,71);assert.equal(ledger[59].requiredFormation,62);
 ledger[60]={target:targets[60],opening:0,declared:0,active:0,attackQueue:0,souls:(await pack(60)).quiet.souls.map(v=>v.id)};
 assert.deepEqual(failures,[],'every authored slot needs a legal attack position in the exact map');
}
const run=async(name,fn)=>{try{await fn();console.log('PASS',name);}catch(error){console.error('FAIL',name,error.stack);process.exitCode=1;}};
await run('55 repeating two-front siege and objective cutoff',testBellSiege);
await run('55 independently admits the east wave when west seats are blocked',()=>testBellSiege(true));
await run('58 exact admission, three phases, counterplay, loss and R',test58);
let winner59;
await run('59 both grounds, real contact, guard, final threat and loss',async()=>{winner59=await test59('guard');});
await run('59 both grounds, real contact, strike, physical retreat and loss',()=>test59('strike'));
await run('57 parked body defeat, signed retry, real reunion and signed 58',test57);
if(winner59)await run('60 true guides, no combat, signed memorial and normal title handoff',()=>test60(winner59));
await run('51–60 authored slots, actual supporting faces, roles and caps',auditRosters);
await run('51→52 through 59→60 exact saved-state conditions and missing-flag negatives',testBoundaryRecipes);
await run('Sodan both area curses through real ground collisions',testSodanGroundImpact);
await run('Sodan native curse support and old thread ledger compatibility',testSodanThread);
await run('51 and 52 native objective order, grounded four, and the Archer cliff projectile',testFirstMissions);
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify({stateChecks,ledger},null,2)+'\n');
