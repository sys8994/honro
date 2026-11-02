/** Bounded actual-App selected guide versus isolated clone; no full play. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './app-regression-helpers.mjs';
import {createPlayerOperations} from '../tools/act2-qa/player-operations.mjs';
import {detachedPlanner} from '../tools/act2-qa/pure-planning.mjs';
import {productionAimPreview} from '../tools/act2-qa/production-aim-preview.mjs';
const id=Number(process.argv[2]||18);assert([18,20].includes(id));
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const p=h.profileThrough(id-1);p.settings.difficulty='normal';p.settings.debugMode=false;
g.performance={now:()=>0};const app=h.load(p);app.launch(id);const e=app.engine,b=e.b,events=[];
const preview=productionAimPreview({app,g,C,record:x=>events.push(x)}),ops=createPlayerOperations({app,g,C,render:preview.render,record:x=>events.push(x)});
assert(ops.ready(),'App input ready');const u=e.active,target=e.alive(1).find(v=>!v.honroObjectiveTarget),skill=u.loadout.map(k=>C.SKILLS[k]).find(s=>s&&!s.passive&&s.damage>0);assert(target&&skill);
const before=JSON.stringify(b),planner=detachedPlanner(C,b),sim=planner.engine,actor=planner.unit(u.id),victim=planner.unit(target.id),seeds=sim.shotSeeds(actor,skill,victim);assert(seeds.length);
for(const a of seeds.slice(0,4))C.shotViable(sim,actor,skill,victim,a.angle,a.power);planner.check();assert.equal(JSON.stringify(b),before);
const chosen=seeds[0],angle=((chosen.angle+85)%360+360)%360-85;assert(angle<=265);assert(ops.selectSkill(skill.id));assert(ops.aim(angle));
// Instrument only the deliberately selected guide. This forwards to the normal
// stage-bound production wrapper; it does not alter the result or live flags.
const calls=[],original=e.predict;e.predict=function(a,s,ang,pow,...rest){const r=original.call(e,a,s,ang,pow,...rest);calls.push({actor:a.id,skill:s.id,angle:ang,power:pow,x:r.x,y:r.y,terrain:r.terrain??null});return r;};
for(let n=0;n<120&&preview.stats().calls===0&&!['won','lost'].includes(b.phase);n++)ops.frame();
assert(preview.stats().calls>0,'Actual selected Renderer.predictionGuide ran');assert(calls.length,'Production guide invoked live stage-bound prediction');
// Compare the exact selected live guide candidate against a fresh clone of its
// current unmodified gameplay state. Evidence is about numerical output, not pixels.
const live=calls.find(x=>x.actor===u.id&&x.skill===skill.id&&Math.abs(x.angle-u.angle)<1e-6)||calls[0];const verify=detachedPlanner(C,b),su=verify.unit(u.id);const out=verify.engine.predict(su,skill,live.angle,live.power);verify.check();
const delta=Math.hypot(out.x-live.x,out.y-live.y),sameTerrain=(out.terrain??null)===live.terrain;assert(delta<1e-6&&sameTerrain,'selected guide clone/live endpoint parity');
const digest=x=>createHash('sha256').update(JSON.stringify(plain(x))).digest('hex');const r={stage:id,seed:b.seed,rng:b.rng,actor:u.id,skill:skill.id,selected:{angle:u.angle,power:live.power},live,clone:{x:out.x,y:out.y,terrain:out.terrain??null},delta,sameTerrain,preview:preview.stats(),previewObservations:events.filter(x=>x.op==='production-preview-observation'),postBattleSha256:digest(b),scope:'Actual App selected-aim production guide, native canvas and DOM/clock doubles; no full play or browser visibility. Speculative candidates scored only on clone.'};
await mkdir('_local/reports/act2-complex-app-probe',{recursive:true});await writeFile(`_local/reports/act2-complex-app-probe/${id}-preview.json`,JSON.stringify(r,null,2));console.log(JSON.stringify(r));
