/** Initial all-threats-defeated/four-at-exit fixture, not reached gameplay.
 * Production App tick, reviewed scene completion, checkMission and outcome.
 * Act4 excluded only to bound memory; Stage11 production runtime is unchanged. */
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {createCompactProject} from '../tools/map-forge/stage11-compact-project.mjs';
process.env.HONRO_ACT4_RELEASE='0';
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4;
const project=createCompactProject(g,g.HONRO_PROJECT,'B-open'),st=project.stages.find(s=>s.metadata.stageId===11),p=h.profileThrough(10);
const b=g.HonroMaps.createBattle(st,project,p,{origin:'campaign'});g.HonroStageRules.sanitizeStageBattle(b);
const end=V.marker(b,'11.exit'),floor=b.terrain.find(t=>t.id==='compact-floor');
for(const [i,u] of b.units.filter(u=>u.side===0).entries()){u.x=end.x-120+i*80;u.y=g.HONRO_CORE.topAt(floor,u.x);u.vx=u.vy=0;u.airborne=u.jumping=false;}
const foes=b.units.filter(u=>u.side===1);for(const u of foes){u.hp=0;u.dead=true;}
const m=V.mem(b);m.done={'11.thread':true,'11.entry-threat':true,'11.exit-threat':true};
m.reviewed11={revision:1,events:Object.fromEntries(['arrival','thread','approach','advance','low-beast','high-sightline','cover-guide','spirit-release','north-warning','north-pair'].map(k=>[k,{status:'done',ids:[],proof:{},fixture:true}])),positions:{},ambient:{count:8,elapsed:0,distance:0}};
const physical=g.HonroAct23V4Chapter11.memory(b);physical.release={admitted:true,ids:[foes[0].id],distance:40};physical.north={admitted:true,ids:[foes[1].id,foes[2].id],offered:{},ended:{}};
g.HonroAct23V4Act2Scenes.memory(b).proof['11.thread']={fixture:true};
p.honroBattle=plain(b);
if(process.env.HONRO_STAGE11_CLOSING_FIXTURE)await writeFile(process.env.HONRO_STAGE11_CLOSING_FIXTURE,JSON.stringify(p));
const expected=['gather','bell','reaction','depart'];
function finish(mode){
 let app=h.load(plain(p));app.continue();app.close();const rows=[];let restarted=false;
 for(let i=0;i<300&&!app.done;i++){
  if(app.dialogue){
   const key=app.dialogue.reviewedEvent;
   if(mode==='orphan'&&key==='depart'&&!restarted){const saved=plain(app.profile);saved.honroBattle.honroStory=null;app=h.load(saved);app.continue();app.close();restarted=true;continue;}
   rows.push(key);
   if(mode==='skip')g.HonroStory.finish(app);
   else while(app.dialogue)g.HonroStory.next(app);
   if(mode==='move-after-bell'&&key==='bell')for(const [j,u] of V.heroes(app.engine.b).entries()){
    u.x=end.x-850+j*80;u.y=g.HONRO_CORE.topAt(floor,u.x);
   }
   if(mode==='skip'&&!restarted){app=h.reload();app.continue();app.close();restarted=true;}
  }
  V.tick(app,.025);
  if(app.engine.b.phase==='won'&&!app.dialogue)app.outcome();
 }
 assert.deepEqual(rows,mode==='skip'?['gather']:expected,JSON.stringify({mode,stage:app.stage.id,done:app.done,phase:app.engine.b.phase,events:Object.keys(g.HonroAct23V4Reviewed.memory(app.engine.b).events),safe:V.safe(app),gathered:g.HonroAct23V4Reviewed.gathered(app.engine.b),steps:V.mem(app.engine.b).done,queue:app.engine.b.honroState.storyQueue?.length,paused:app.modal.classList.contains("open"),busy:app.engine.settleBusy(),store:app.profileStore.state}));
 assert(V.mem(app.engine.b).done['11.exit']);assert(V.mem(app.engine.b).done['11.north']);assert(g.HonroAct23V4Chapter11.complete(app.engine.b));assert(g.HonroAct23V4Reviewed.complete(app.engine.b));
 assert.equal(app.engine.b.phase,'won');assert(app.done);assert.equal(app.profile.cleared[11].visits,1);app.outcome();assert.equal(app.profile.cleared[11].visits,1);
 const reviewed=g.HonroAct23V4Reviewed.memory(app.engine.b);
 if(mode==='skip')for(const key of expected.slice(1))assert.equal(reviewed.events[key].presentedIds.length,0,`${key}: skipping must not add a reading receipt`);
 console.log(`PASS: Stage 11 closing fixture, ${mode}: ${rows.join(', ')}, won and settled once`);
}
for(const mode of ['next','skip','orphan','move-after-bell'])finish(mode);
