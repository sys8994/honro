/** Initial all-threats-defeated/four-at-exit fixture, not reached gameplay.
 * Production App tick, reviewed scene completion, checkMission and outcome.
 * Act4 excluded only to bound memory; Stage11 production runtime is unchanged. */
import assert from 'node:assert/strict';
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
p.honroBattle=plain(b);const app=h.load(p);app.continue();
const rows=[];
for(let i=0;i<300&&!app.done;i++){if(app.dialogue){rows.push(app.dialogue.reviewedEvent);h.finish(app);}V.tick(app,.025);}
console.log({phase:app.engine.b.phase,done:app.done,steps:V.mem(app.engine.b).done,rows,mission:g.HonroObjectives.state(app.engine.b,app.stage).complete});
assert(V.mem(app.engine.b).done['11.exit']);assert(V.mem(app.engine.b).done['11.north']);assert(g.HonroAct23V4Chapter11.complete(app.engine.b));assert(g.HonroAct23V4Reviewed.complete(app.engine.b));assert.equal(app.engine.b.phase,'won');app.outcome();if(app.dialogue)h.finish(app);assert(app.done);assert(app.profile.cleared[11]);console.log('PASS: initial near-exit fixture reaches gather/bell/reaction/depart, won, and recorded outcome. Not full-stage play.');
