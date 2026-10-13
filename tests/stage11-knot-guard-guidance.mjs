// Read-only headline fixtures. Declared objective/actor states are not a normal
// campaign clear; eligibility and App save/export/Continue are production paths.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const h=await appHarness(),{g}=h,A=g.HonroAct2,checks=[];
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
function make(id='knot-east'){
 const q=battlefield(g,11),{b,e,app}=q;A.attach(app,e);
 for(const s of A.steps(b)){if(s.id===id)break;A.memory(b).done[s.id]=true;}
 const m=b.honroMarkers.find(m=>m.id===id),foes=e.alive(1),sodan=e.heroesAlive().find(u=>u.cls==='occultist'),archer=e.heroesAlive().find(u=>u.cls==='archer');
 for(const foe of foes)foe.x=1000;
 for(const hero of e.heroesAlive())Object.assign(hero,{x:m.x,y:m.y});
 b.active=sodan.id;b.side=0;b.phase='aim';app.canInput=()=>true;app.scene={};g.HonroObjectives.state(b,q.st);
 return {...q,m,foes,sodan,archer};
}
function text(q,expected){
 const before=JSON.stringify(q.b),state=g.HonroObjectives.state(q.b,q.st);
 assert.equal(state.currentObjectiveId,q.m.id);assert.equal(state.currentInstruction,expected);
 g.HonroObjectives.refresh(q.app);assert.equal(h.nodes.get('objective-text').textContent,expected);
 assert.equal(g.HonroObjectives.help(q.app).guide,expected);assert.equal(JSON.stringify(q.b),before,'Presentation must not mutate saved progress');
 return g.HonroInteractions.eligibility(q.app,q.m);
}
function check(name,fn){fn();checks.push(name);console.log('PASS',name);}
check('east knot exposes the exact local guard gate before approach and switches to E only at zero',()=>{
 const q=make(),[one,two,edge,subdued,boss,dead]=q.foes;
 Object.assign(one,{x:q.m.x+359,y:q.m.y});Object.assign(two,{x:q.m.x-240,y:q.m.y});
 Object.assign(edge,{x:q.m.x+360,y:q.m.y});Object.assign(subdued,{x:q.m.x,y:q.m.y,honroSubdued:true});
 Object.assign(boss,{x:q.m.x,y:q.m.y,honroAct2Boss:true});Object.assign(dead,{x:q.m.x,y:q.m.y,dead:true,hp:0});
 assert.equal(text(q,'동쪽 혼매듭 주변의 들림 2명을 먼저 제압하세요').reason,'주변 들림을 먼저 제압하세요');
 q.sodan.x-=1200;assert.equal(text(q,'동쪽 혼매듭 주변의 들림 2명을 먼저 제압하세요').reason,'더 가까이 이동');q.sodan.x=q.m.x;
 one.honroSubdued=true;assert.equal(text(q,'동쪽 혼매듭 주변의 들림 1명을 먼저 제압하세요').ok,false);
 Object.assign(two,{dead:true,hp:0});assert.equal(text(q,'동쪽 혼매듭 해체').ok,true);
 assert.deepEqual(plain(A.interactionThreats(q.b,q.m)),[]);
});
check('west knot preserves the required Sodan headline after guards are gone',()=>{
 const q=make('knot-west'),one=q.foes[0];q.b.active=q.archer.id;Object.assign(one,{x:q.m.x+100,y:q.m.y});
 text(q,'서쪽 혼매듭 주변의 들림 1명을 먼저 제압하세요');one.honroSubdued=true;
 const rule=text(q,'소단 · 서쪽 혼매듭 해체');assert.equal(rule.ok,false);assert.equal(rule.reason,'소단 필요');
 q.b.active=q.sodan.id;assert.equal(text(q,'소단 · 서쪽 혼매듭 해체').ok,true);
});
check('legacy and custom chapters and unrelated objectives retain their existing presentation',()=>{
 for(const alter of [b=>b.honroStage11EncounterRevision=1,b=>delete b.honroStage11EncounterRevision,b=>b.honroCustom=true,b=>b.honroStage=12,b=>b.honroAct2Revision=1]){
  const q=make();alter(q.b);Object.assign(q.foes[0],{x:q.m.x,y:q.m.y});
  assert.equal(g.HonroStage11RavineEncounters.knotInstruction(q.b,{id:'knot-east',kind:'interact'}),null);
 }
 const q=make();assert.equal(g.HonroStage11RavineEncounters.knotInstruction(q.b,{id:'resident',kind:'rescue'}),null);
});
const q=make();Object.assign(q.foes[0],{x:q.m.x+100,y:q.m.y});
const profile=h.profileThrough(10);profile.honroBattle=plain(q.b);let app=h.load(profile);app.continue();
const expected='동쪽 혼매듭 주변의 들림 1명을 먼저 제압하세요';
assert.equal(g.HonroObjectives.state(app.engine.b,app.stage).currentInstruction,expected);
const before=plain(app.engine.b);app.export();app=h.load(await h.exported());app.continue();
assert.deepEqual(plain(app.engine.b),before);assert.equal(g.HonroObjectives.help(app).guide,expected);
checks.push('production export/load/Continue preserves the exact battle and local guard headline');console.log('PASS',checks.at(-1));
await report('stage11-knot-guidance',checks,{scope:'Read-only knot headline and unchanged exact interaction gate; no map, quest, balance, browser or normal completion claim.'});
