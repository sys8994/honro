// Production App/Engine tests; authored landing positions are controlled fixtures.
// The DOM/audio/storage are doubles. This does not claim normal fullplay or visuals.
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),{g,C}=h,B=g.HonroBellAnomaly,rows=[];
assert(B,'shared build manifest must load the production module');
function fresh(stage=18){const app=h.load(h.profileThrough(stage-1));app.launch(stage);h.finish(app);app.turnNotice=null;return app;}
function ready(app){const b=app.engine.b,u=app.engine.unit('p-archer');Object.assign(b,{active:u.id,side:0,phase:'aim'});Object.assign(u,{x:4300,y:5770,vx:0,vy:0,acted:false,moving:0,jumping:false,airborne:false});assert(app.engine.grounded(u),'actual authored lower-court step supports this shot');return u;}
const fire=e=>e.fire('A01',-15,.55),same=(a,b)=>assert.deepEqual(plain(a),plain(b));
function resolve(app){let frames=0;while(B.blocked(app)&&frames++<960){app.engine.tick(C.STEP);if(!app.dialogue)app.missionTick(C.STEP);}assert(frames<960,'observation cannot hang');return frames;}
{
 const app=fresh(),e=app.engine,b=e.b,u=ready(app);assert.equal(b.honroBellAnomalyRevision,1);assert(B.eligible(e,'A01',-15,.55,false));
 Object.assign(u,{focus:71,prepared:{rank:3,expires:b.round+2},arrowTurn:8,arrowTurnToken:'previous',cooldowns:{A04:b.round+3}});u.ranks.AP01=3;if(!u.loadout.includes('AP01'))u.loadout.push('AP01');
 const target=b.units.find(v=>v.side===1&&!v.honroObjectiveTarget);target.salheun={[u.id]:{entries:[{turn:1,damage:40}],action:0,recorded:0,cap:100,projectiles:[]}};
 const before=plain(B.capture(b)),objective=plain(b.honroState.act2),round=b.round,serial=b.honroState.actorTurnSerial;
 const events=[],emit=e.emit.bind(e);e.emit=(type,data)=>{events.push({type,...data});return emit(type,data);};
 assert(fire(e));assert(B.blocked(app));assert.equal(b.projectiles.length,1);assert.equal(b.projectiles[0].skill,'A01');assert.equal(b.volley,undefined);assert(!e.canAct());assert(!app.canInput());
 for(let i=0;i<20;i++){e.tick(C.STEP);app.missionTick(C.STEP);}same(b.honroState.act2,objective);assert.equal(b.round,round);assert.equal(b.honroState.actorTurnSerial,serial);
 const afterLaunch=events.length;resolve(app);assert.equal(b.honroState.bellAnomaly.count,1);assert.equal(b.honroState.bellAnomaly.status,'RESOLVED');same(B.capture(b),before);
 assert(!events.slice(afterLaunch).some(v=>v.type==='sound'),'vanishing has no collision/bell sound');
 assert(app.dialogue?.bellAnomaly,'ordinary blocking story begins in the disappearance substep');assert.equal(app.dialogue.lines[0][0],'설오');assert.equal(app.profile.honroStoryEvents['act2-bell-anomaly-v1'],true);
 h.finish(app);assert(!B.blocked(app));assert(e.canAct());assert(fire(e));assert.equal(b.honroState.bellAnomaly.count,1);assert(!B.blocked(app));assert(b.volley,'the next ordinary shot keeps automatic volley');
 rows.push('actual A01 from an authored supported position disappears once, freezes objectives/rounds, refunds HP/Ki/action/movement/cooldown/prepare/arrow history/volley, and immediately locks story');
}
{
 const app=fresh(),e=app.engine,b=e.b;ready(app);const before=plain(B.capture(b));assert(fire(e));for(let i=0;i<30;i++)e.tick(C.STEP);
 app.export();const exported=await h.exported();assert(JSON.stringify(exported).length<8000000);await h.import(exported);app.continue();h.finish(app);
 assert.equal(B.memory(app.engine.b).status,'READY');same(B.capture(app.engine.b),before);assert(!app.engine.b.projectiles.length);assert(app.engine.canAct());
 assert(fire(app.engine));resolve(app);h.finish(app);app.export();await h.import(await h.exported());app.continue();h.finish(app);
 assert.equal(B.memory(app.engine.b).status,'RESOLVED');assert.equal(B.memory(app.engine.b).count,1);assert.equal(app.profile.honroStoryEvents['act2-bell-anomaly-v1'],true);
 rows.push('real export/import/Continue during flight restores exact pre-shot action; after resolution preserves one completed observation and journal through reload');
}
{
 const app=fresh(),e=app.engine,b=e.b,u=ready(app);const base=e.predict(u,C.SKILLS.A01,-15,.55),point=base.points.find(p=>(1-((p.x-B.REGION.x)/B.REGION.rx)**2-((p.y-B.REGION.y)/B.REGION.ry)**2)>.23);assert(point);
 const chain=e.unit('upper-chain'),record=g.HonroQuestTargets.records(b).find(t=>t.id==='upper-chain');assert(chain?.honroObjectiveTarget);assert.equal(chain.maxHp,240);assert(record);
 const unitPose=plain(chain),recordPose=plain(record);Object.assign(chain,{x:point.x,y:point.y+chain.h*.5});assert(!B.eligible(e,'A01',-15,.55,false),'hostile objective actor downstream of pocket stays protected');Object.assign(chain,unitPose);
 Object.assign(record,{x:point.x-50,y:point.y-50,w:100,h:100});assert(!B.eligible(e,'A01',-15,.55,false),'quest record protects the shot even when its actor is elsewhere');Object.assign(record,recordPose);
 assert(!B.eligible(e,'A01',-15,.55,true));u.summoned=true;assert(!B.eligible(e,'A01',-15,.55,false));delete u.summoned;
 for(const id of ['M09','M06','O14','S00','A04'])assert(!B.eligible(e,id,-15,.55,false),id);
 assert(B.eligible(e,'A01',-15,.55,false));
 rows.push('upper-chain HP240 hostile actor and off-terrain quest record independently protect the full intended shot; AI/summons/stakes/body/other skills cannot be consumed');
}
{
 const app=fresh(),e=app.engine,b=e.b,u=ready(app);B.memory(b).status='RESOLVED';B.memory(b).count=1;
 const predicted=e.predict(u,C.SKILLS.A01,-15,.55),without=plain(b);delete without.honroBellAnomalyRevision;const clear=new C.Engine(without);const normal=clear.predict(clear.unit(u.id),C.SKILLS.A01,-15,.55);
 assert(Math.hypot(predicted.x-normal.x,predicted.y-normal.y)>1,'local pull is a real trajectory change');assert(fire(e));const p=b.projectiles[0];let count=0;while(b.projectiles.includes(p)&&count++<1440)e.stepProjectile(p,C.STEP);
 assert(count<1440);assert(Math.hypot(p.x-predicted.x,p.y-predicted.y)<.001,'actual swept collision agrees with production prediction');
 const probe={...p,x:B.REGION.x,y:B.REGION.y,vx:300,vy:0};assert(B.force(b,probe));assert.equal(B.force(b,{...probe,body:true}),null);assert.equal(B.force(b,{...probe,skill:'M09',mode:'stakeGate'}),null);
 assert.equal(B.force({...b,honroStage:19},probe),null);assert.equal(B.force({...b,phase:'won'},probe),null);assert.equal(B.force({...b,honroBellAnomalyRevision:undefined},probe),null);
 rows.push('subsequent local force changes trajectory through shared advanceProjectile; actual terminal collision matches prediction; bodies/stakes/other stages/finished and old battles have no force');
}
{
 const app=fresh(),b=app.engine.b;ready(app);delete b.honroBellAnomalyRevision;delete b.honroState.bellAnomaly;const old=plain(b);app.profile.honroBattle=plain(b);app.persist();const resumed=h.reload();resumed.continue();h.finish(resumed);
 assert(!B.active(resumed.engine.b));assert.equal(resumed.engine.b.honroBellAnomalyRevision,undefined);assert.equal(resumed.engine.b.honroState.bellAnomaly,undefined);same(resumed.engine.b.terrain,old.terrain);same(resumed.engine.b.honroAct2Steps,old.honroAct2Steps);
 assert.equal(fresh(19).engine.b.honroBellAnomalyRevision,undefined);assert.equal(fresh().engine.b.honroBellAnomalyRevision,1);
 rows.push('old Continue retains original map/objectives and no anomaly flag; fresh revisit can recover the scene; stage19 has no inherited projectile anomaly');
}
await report('bell-anomaly',rows,{limits:['Controlled actor position on actual authored geometry, not a traversal/fullplay claim.','Only a player-controlled A01 crossing the marked pocket is eligible for the one refunded observation; other styles remain usable and can miss this observation.','DOM, sound and storage are test doubles; screenshots and real browser inputs are separate final checks.']});
for(const row of rows)console.log('PASS',row);
