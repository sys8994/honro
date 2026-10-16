/** Continue an actual bounded-run export and issue only normal movement/defend inputs. */
import assert from 'node:assert/strict';import vm from 'node:vm';import{gunzipSync}from'node:zlib';
import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
import{appHarness,plain}from'./app-regression-helpers.mjs';
import{escortNavigator}from'./stage23-escort-fullplay-helper.mjs';
import{auditQuarryEngine}from'./stage12-quarry-fullplay-helper.mjs';
const file=process.argv[2];assert(file,'Real export checkpoint required');const bytes=await readFile(file),input=file.endsWith('.gz')?gunzipSync(bytes):bytes,saved=JSON.parse(input),h=await appHarness(),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);let ms=saved.virtualMs;g.performance={now:()=>ms};const app=h.load(saved.profile);app.continue();const e=app.engine,b=e.b;assert.deepEqual(plain(b),saved.profile.honroBattle,'Actual Continue exact, no actor/objective/resource edits');const start=plain(b),events=[],audit=auditQuarryEngine(b,e,()=>({round:b.round}));let frames=0;
function tick(){ms+=C.STEP*1000;if(app.dialogue){audit.production(()=>g.HonroStory.next(app));return;}g.HonroStory.turn(app);if(g.HonroStory.turnPaused(app))return;e.tick(C.STEP);audit.production(()=>app.missionTick(C.STEP));audit.guard();frames++;}
const nav=escortNavigator(g,b,e,{tick,ready:()=>app.canInput(),record:r=>events.push({round:b.round,...r}),stageId:23,routes:g.HONRO_PROJECT.stages[22].design.escortYard.routes});
const goals=[{id:'west-support',x:4320,y:3650,surfaceId:'sy-west-upper'},{id:'return-to-west-floor',x:1100,y:4275.454545454545,surfaceId:'sy-ground'}];goals[1].y=C.topAt(b.terrain.find(t=>t.id===goals[1].surfaceId),goals[1].x);let index=0,actions=0;
for(;actions<48&&!['won','lost'].includes(b.phase)&&index<goals.length;actions++){
 for(let i=0;i<10000&&!app.canInput()&&!['won','lost'].includes(b.phase);i++)tick();if(!app.canInput())break;
 const u=e.heroesAlive().find(u=>u.cls==='mage'&&!u.acted);if(u){e.select(u.id);const goal=goals[index],from={x:u.x,y:u.y,hp:u.hp};nav.advance(u,goal);events.push({op:'input-route-attempt',round:b.round,from,to:{x:u.x,y:u.y,hp:u.hp},goal,support:nav.surface(u)});if(Math.abs(u.x-goal.x)<25&&Math.abs(u.y-goal.y)<10&&nav.surface(u)===goal.surfaceId){events.push({op:'reached',round:b.round,goal});index++;nav.clear(u.id);}}
 if(app.canInput())audit.production(()=>app.defend());
}
assert.equal(audit.log.externalWrites.length,0);assert.equal(audit.log.recoveries.length,0);assert.deepEqual(plain(b.items),start.items);
const out={scope:'Actual normal-run exported battle Continue; normal select/move/jump/defend and story inputs only. No battle edits; no enemy removal/AI disable/HP reset. Tests reachable upper support and return, not a winning tactic or whole-stage clear.',checkpointSha256:createHash('sha256').update(input).digest('hex'),navigatorSha256:createHash('sha256').update(await readFile('tests/stage23-escort-fullplay-helper.mjs')).digest('hex'),exactContinue:true,passed:index===goals.length,actions,frames,start:{round:start.round,heroes:start.units.filter(u=>u.side===0).map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp}))},end:{round:b.round,phase:b.phase,heroes:e.heroesAlive().map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp})),npc:e.unit('act3-carrier')},events,audit:audit.log};await writeFile('review/stage23/support-return-input.json',JSON.stringify(out,null,2));console.log(JSON.stringify({passed:out.passed,actions,round:b.round,phase:b.phase,goals:index}));if(!out.passed)process.exitCode=1;
