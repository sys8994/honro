/** Production objective/checkMission regression; explicit state fixtures, not gameplay proof.
 * DOM/Canvas/audio/storage use existing harness doubles. No victory claim from fixtures. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const h=await appHarness({productionStory:true}),g=h.g,app=h.load(h.profileThrough(39)),cases=[];
// Build actual authored battles first; the focused adapter below installs the
// production victory checker without starting its unrelated animation loop.
const objectiveNode=g.document.getElementById('objective-text'),attrs=new Map();objectiveNode.getAttribute=k=>attrs.get(k);objectiveNode.setAttribute=(k,v)=>attrs.set(k,v);
const battles=[];
for(let id=31;id<=40;id++){app.launch(id);h.finish(app);battles.push({b:app.engine.b,st:app.stage,e:app.engine});app.stopBattle();}
g.HonroApp=app;g.HONRO_ACT4_PREVIEW_SEEDS=JSON.parse(await readFile('shared/data/act4/reviewed.json','utf8'));
for(const name of ['interactions','act4-art','act4-maps','act4-coast-maps','act4-coast-art','act4-events','act4-coast-events','act4-campaign'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
for(const {b,st,e} of battles){
 app.engine=e;app.stage=st;app.scene={};app.training=false;b.phase='aim';
 for(const u of b.units.filter(u=>u.side===1)){u.hp=0;u.dead=true;}
 b.honroAct4PreviewState={complete:false,events:{},receipts:[],boat:{phase:'waiting'},door:{phase:'standing'}};
 const before=plain(b),s=g.HonroObjectives.state(b,st);
 assert.equal(s.complete,false,st.id+' empty enemy roster is not a win');assert.notEqual(s.currentInstruction,'목표 완료');
 assert.equal(app.checkMission(e),false);assert.equal(b.phase,'aim');
 g.HonroObjectives.refresh(app);assert.equal(h.nodes.get('objective-text').textContent,s.currentInstruction);
 assert.equal(g.HonroObjectives.help(app).summary,s.currentInstruction);assert.deepEqual(plain(b),before,'presentation does not mutate saved state');
 // Save/reload-shaped copies must derive the same guidance (no hidden UI state).
 assert.deepEqual(plain(g.HonroObjectives.state(plain(b),st)),plain(s));
 b.honroAct4PreviewState.complete=true;
 assert.equal(g.HonroObjectives.state(b,st).complete,true);assert.equal(app.checkMission(e),true);assert.equal(b.phase,'won');
 g.HonroObjectives.refresh(app);assert.equal(h.nodes.get('objective-text').textContent,'목표 완료');
 b.phase='aim';b.honroAct4PreviewState.complete=false;b.honroAct4PreviewState.failure='rescue-casualty';
 assert.equal(g.HonroObjectives.state(b,st).complete,false);assert.match(g.HonroObjectives.state(b,st).summary,/실패/);assert.equal(app.checkMission(e),true);assert.equal(b.phase,'lost');
 cases.push(st.id+' authored stage: zero enemies / saved copy / HUD / help / real completion flag / failure agree');
}
const byId=id=>battles.find(x=>x.st.id===id),check=(id,q,pattern)=>{const {b,st}=byId(id);b.phase='aim';b.honroAct4PreviewState={complete:false,events:{},receipts:[],...q};const s=g.HonroObjectives.state(b,st);assert.equal(s.complete,false);assert.match(s.currentInstruction,pattern);};
check(31,{boat:{phase:'approach'}},/배가 도착/);check(31,{boat:{phase:'docked'}},/전원.*갑판.*상호작용/);
check(32,{},/설오.*재회/);check(32,{safeSeven:{},events:{missing_four:{terminal:true}}},/동쪽 출구/);
check(36,{door:{phase:'standing'}},/휘겸.*문/);check(36,{door:{phase:'falling'}},/넘어지는/);
check(36,{door:{phase:'fallen'}},/문 곁/);check(36,{door:{phase:'fallen'},receipts:['A4.S36.DOOR.01','A4.S36.DOOR.02']},/이탈 대화/);
check(37,{events:{signal:{terminal:true}}},/출구/);check(38,{},/비상 턱/);check(38,{connected:{}},/연결된 길/);
check(39,{},/고정/);check(39,{exitStable:{}},/그물/);check(39,{exitStable:{},netOpen:{}},/네 명/);check(39,{exitStable:{},netOpen:{},rescued:{ids:[0,1,2,3]}},/출구/);
check(40,{},/배·높은 길/);check(40,{returnEscort:{phase:'safe'}},/재회와 귀환/);check(40,{returnEscort:{phase:'safe'},events:{next:{terminal:true}}},/전원.*상호작용/);
check(31,{reader:{key:'board_ready'},boat:{phase:'docked'}},/대화를 마친/);
// Reproduce the competing writer: boat observer followed by ordinary HUD refresh.
{
 const {b,st,e}=byId(31);app.engine=e;app.stage=st;app.dialogue=null;app.close();b.phase='aim';
 b.honroAct4PreviewState={complete:false,clock:0,events:{arrival:{started:true}},receipts:[],boat:{phase:'docked'},door:{phase:'standing'}};
 for(const complete of [false,true]){b.honroAct4PreviewState.complete=complete;g.HonroAct4TerrainPreview.observe(app,0);const text=h.nodes.get('objective-text').textContent;g.HonroObjectives.refresh(app);assert.equal(h.nodes.get('objective-text').textContent,text);assert.equal(text==='목표 완료',complete);}
 cases.push('Actual boat event observer and ordinary HUD refresh agree before and after completion');
}
// Predicate fixtures only: hold contact true and place parties at the declared
// exit boundary to isolate whether an explicit interaction is required. This
// does not demonstrate physical travel, ordinary victory or auto-play quality.
for(const id of [35,36,40]){
 const {b,st,e}=byId(id);app.engine=e;app.stage=st;app.dialogue=null;app.done=false;app.screen='battle';app.close();b.phase='aim';b.side=0;
 for(const u of b.units.filter(u=>u.side===0)){u.x=id===40?5500:6700;u.acted=false;u.dead=false;u.hp=Math.max(1,u.hp);}
 b.honroAct4PreviewState={complete:false,clock:10,quietAt:0,events:{leave:{terminal:true},next:{terminal:true}},receipts:['A4.S36.DOOR.01','A4.S36.DOOR.02'],door:{phase:'fallen'},returnEscort:{phase:'safe'}};
 const grounded=e.grounded,save=g.HonroAct4TerrainPreview.save;e.grounded=()=>true;g.HonroAct4TerrainPreview.save=()=>false;
 try{assert.equal(app.checkMission(e),false);assert.equal(b.honroAct4PreviewState.complete,false);assert.equal(g.HonroAct4TerrainPreview.interact(app,true),true,id+' has a ready interaction');assert.equal(b.honroAct4PreviewState.complete,false,'readiness probe cannot win');assert.match(g.HonroObjectives.state(b,st).summary,/상호작용/);assert.equal(g.HonroAct4TerrainPreview.interact(app),true);assert.equal(b.honroAct4PreviewState.complete,true);assert.equal(b.phase,'won');}
 finally{e.grounded=grounded;g.HonroAct4TerrainPreview.save=save;}
 cases.push(id+' ready exit does not auto-complete; explicit interaction completes (contact/position fixture)');
}
// Existing general objective semantics remain untouched outside official Act4.
const {b,st}=byId(31);const old=plain(b);old.honroAct4Official=0;old.honroAct4PreviewState={complete:false};assert.equal(g.HonroAct4Content.active(old),false);assert.equal(g.HonroObjectives.state(old,st).complete,true);
const defeated=plain(byId(31).b);defeated.phase='aim';defeated.honroAct4PreviewState={complete:false};for(const u of defeated.units.filter(u=>u.side===0)){u.hp=0;u.dead=true;}assert.match(g.HonroObjectives.state(defeated,byId(31).st).summary,/실패/);assert.equal(app.checkMission({b:defeated}),true);assert.equal(defeated.phase,'lost');
cases.push('19 intermediate event states guide remaining actions; non-official fallback unchanged');
await report('act4-objective-guidance',cases,{scope:'Authored production battles, explicit event-state fixtures and actual campaign checkMission; no browser, ordinary playthrough or fun validation.'});console.log(JSON.stringify({status:'PASS',cases}));
