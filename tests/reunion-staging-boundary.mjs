/** Explicit in-range pose fixture using the actual App, Story queue and staging module. */
import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
const h=await appHarness(),g=h.g,A=g.HonroAct3;
const app=h.load(h.profileThrough(27));app.launch(28);h.finish(app);app.turnNotice=null;
const b=app.engine.b,m=A.marker(b,'party-reunion'),memory=A.memory(b),group=A.heroes(b);
assert.equal(group.length,4);memory.done['water-release']=memory.done['fire-screen']=true;
for(const [i,u]of group.entries())Object.assign(u,{x:m.x+(i-1.5)*35,y:m.y,vx:0,vy:0,airborne:false,jumping:false});
const positions=()=>plain(group.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,focus:u.focus})));
const before=positions(),clock=plain({round:b.round,teamEnds:b.teamEnds,fireTurns:memory.fireTurns});
app.actorBoundary=null;A.tick(app,0);assert(!memory.done['party-reunion']);assert(!app.dialogue);
app.actorBoundary=b.active;A.tick(app,0);app.actorBoundary=null;
assert(memory.done['party-reunion']);assert.equal(app.dialogue?.staging?.id,'act3-party-reunion-v2');
assert.equal(b.honroStaging.once['act3-party-reunion-v2'],'running');assert(!app.canInput());
assert.deepEqual(positions(),before,'The actual Story lock starts while all four are still in range');
for(let now=1000;now<2200;now+=50)g.HonroStory.tick(app,now);
assert(app.dialogue.staging.complete);assert(app.dialogue.lines.length>=4);for(const row of g.HonroStoryStaging.describe('act3-party-reunion-v2').steps.at(-1).lines)assert(app.dialogue.lines.some(l=>l[0]===row[0]&&l[1]===row[1]),'authored reunion text is preserved');assert.equal(app.dialogue.index,0);assert.equal(app.dialogue.lines[0][0],'서술');g.HonroStory.next(app);assert.equal(app.dialogue.index,1);
assert.deepEqual(positions(),before);assert.deepEqual(plain({round:b.round,teamEnds:b.teamEnds,fireTurns:memory.fireTurns}),clock);
h.finish(app);assert.equal(b.honroStaging.once['act3-party-reunion-v2'],'done');
app.actorBoundary=b.active;A.tick(app,0);app.actorBoundary=null;assert(!app.dialogue,'Reunion cannot queue twice');
await report('reunion-staging-boundary',['Actual in-range actor boundary immediately opens the real staging lock; four positions, HP/MP and combat clocks stay fixed; one authored scene with manual narration'],{scope:'Declared in-range/control-completed state; production queue and staging execute without replacing their APIs. DOM/Canvas are doubles. Not normal combat or browser evidence.'});
console.log('PASS actual reunion staging boundary, fixed four-body pose, frozen clocks and single delivery');

const wrong=h.load(h.profileThrough(26));wrong.launch(27);h.finish(wrong);assert.equal(wrong.engine.b.honroSplit.version,2);assert.equal(g.HonroStoryStaging.request(wrong,'act3-party-reunion-v1'),false);assert.equal(g.HonroStoryStaging.opening(wrong,[['서술','구형',{stagingRequest:{id:'act3-party-reunion-v1'}}]],{}).lines.length,0);console.log('PASS incompatible v1 reunion cannot open in current v2 stage27');

const oldProfile=h.profileThrough(26);oldProfile.honroSplitCampaign={version:1,mode:'continuous',stage:27,nextStage:27,finished:false,vitals:{},starts:{},completed:{24:true,25:true,26:true},items:null,activeRoster:['archer','mage','knight','occultist']};const old=h.load(oldProfile);old.launch(27);h.finish(old);assert.equal(old.engine.b.honroSplit.version,1);assert(g.HonroAct3.marker(old.engine.b,'party-reunion'));assert(old.engine.b.units.some(u=>u.cls==='knight'&&u.side===0));old.actorBoundary=old.engine.b.active;assert(g.HonroStoryStaging.request(old,'act3-party-reunion-v1'));assert.equal(old.dialogue.staging.id,'act3-party-reunion-v1');console.log('PASS supported v1 map retains its real reunion marker and four-person dialogue');
