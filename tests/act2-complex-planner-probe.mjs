/** Bounded clone-planner purity probe; no full play and no claim of browser UI. */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './act2-complex-app-harness.mjs';
import {createPlayerOperations} from '../tools/act2-qa/player-operations.mjs';
const id=Number(process.argv[2]||18);assert([18,20].includes(id));
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const p=h.profileThrough(id-1);p.settings.difficulty='normal';p.settings.debugMode=false;
g.performance={now:()=>0};const app=h.load(p);app.launch(id);const e=app.engine,b=e.b,ops=createPlayerOperations({app,g,C});
assert(ops.ready(),'App input ready');
const u=e.active,target=e.alive(1).find(v=>!v.honroObjectiveTarget),skill=u.loadout.map(k=>C.SKILLS[k]).find(s=>s&&!s.passive&&s.damage>0);assert(target&&skill);
const digest=x=>createHash('sha256').update(JSON.stringify(plain(x))).digest('hex'),before=digest(b),rngBefore={seed:b.seed,rng:b.rng};
const copy=structuredClone(b),sim=new C.Engine(copy,()=>{},true),actor=sim.unit(u.id),victim=sim.unit(target.id);assert(actor&&victim);
const seeds=sim.shotSeeds(actor,skill,victim),trials=[];for(const a of seeds.slice(0,4)){const v=C.shotViable(sim,actor,skill,victim,a.angle,a.power);trials.push({angle:a.angle,power:a.power,ok:v.ok,net:v.net,risk:v.risk,miss:v.miss});}
assert.equal(digest(b),before,'Clone speculative scoring must not mutate live battle');assert.equal(b.seed,rngBefore.seed);assert.equal(b.rng,rngBefore.rng);
assert.deepEqual(plain(copy.terrain),plain(b.terrain),'Clone starts with live compiled terrain');
const r={stage:id,phase:b.phase,actor:u.id,target:target.id,skill:skill.id,liveBattleSha256:before,seed:b.seed,rng:b.rng,cloneTerrainSha256:digest(copy.terrain),seeds:seeds.length,trials,liveUnchanged:true,scope:'Bounded speculative clone only; no live aim/guide, no browser or full play. Semantic parity of stage-specific predictive physics requires separate observation.'};
await mkdir('_local/reports/act2-complex-app-probe',{recursive:true});await writeFile(`_local/reports/act2-complex-app-probe/${id}.json`,JSON.stringify(r,null,2));console.log(JSON.stringify(r));
