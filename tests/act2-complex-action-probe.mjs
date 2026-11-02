/** Bounded actual-App single-shot calibration, never a full playthrough. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {appHarness,plain} from './act2-complex-app-harness.mjs';
import {auditQuarryEngine} from './stage12-quarry-fullplay-helper.mjs';
import {createPlayerOperations} from '../tools/act2-qa/player-operations.mjs';
import {detachedPlanner} from '../tools/act2-qa/pure-planning.mjs';
import {productionAimPreview} from '../tools/act2-qa/production-aim-preview.mjs';
const id=Number(process.argv[2]||18);assert([18,20].includes(id));
const h=await appHarness({productionStory:true,productionInputActions:true}),{g,C}=h;
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);const profile=h.profileThrough(id-1);profile.settings.difficulty='normal';profile.settings.debugMode=false;
g.performance={now:()=>0};const app=h.load(profile);app.launch(id);const e=app.engine,b=e.b,events=[];
const preview=productionAimPreview({app,g,C,record:x=>events.push(x)}),ops=createPlayerOperations({app,g,C,render:preview.render,record:x=>events.push(x)}),audit=auditQuarryEngine(b,e,()=>({round:b.round,frame:ops.frames}));
audit.production(()=>ops.ready());audit.guard();assert(app.canInput());const rngAtEntry={seed:b.seed,rng:b.rng};
const u=e.active,skills=u.loadout.map(k=>C.SKILLS[k]).filter(s=>s&&!s.passive&&s.damage>0),foes=e.alive(1).filter(v=>!v.honroObjectiveTarget).slice(0,5);let chosen=null;
for(const foe of foes){for(const skill of skills.slice(0,2)){const q=detachedPlanner(C,b),actor=q.unit(u.id),target=q.unit(foe.id);for(const aim of q.engine.shotSeeds(actor,skill,target).slice(0,6)){const v=C.shotViable(q.engine,actor,skill,target,aim.angle,aim.power);if(v.ok&&v.risk<1&&(!chosen||v.net>chosen.net))chosen={target:foe.id,skill:skill.id,...aim,net:v.net,risk:v.risk};}q.check();} }
let accepted=false,before=null,after=null,actual=null;if(chosen){const angle=((chosen.angle+85)%360+360)%360-85;if(angle<=265){before=Object.fromEntries(b.units.map(v=>[v.id,{hp:v.hp,side:v.side}]));accepted=audit.production(()=>ops.fire(chosen.skill,angle,chosen.power));audit.guard();if(!accepted){audit.production(()=>ops.ready(30000));audit.guard();if(app.canInput()&&e.active?.id===u.id)accepted=audit.production(()=>ops.fire(chosen.skill,angle,chosen.power));audit.guard();}actual=plain(b.lastShots?.[u.id]||null);if(accepted)audit.production(()=>ops.ready(30000));audit.guard();after=Object.fromEntries(b.units.map(v=>[v.id,{hp:v.hp,side:v.side}]));}}
const changes=before&&after?Object.entries(after).filter(([k,v])=>before[k]&&v.hp!==before[k].hp).map(([id,v])=>({id,side:v.side,hpDelta:v.hp-before[id].hp})):[];
const r={stage:id,phase:b.phase,round:b.round,rngAtEntry,chosen,accepted,actual,inputState:{canInput:app.canInput(),charging:!!app.charging,dialogue:app.dialogue?{title:app.dialogue.title,index:app.dialogue.index}:null,phase:b.phase,side:b.side,active:b.active,frame:ops.frames,lastError:app.lastError||null},hpChanges:changes,externalWrites:audit.log.externalWrites,recoveries:audit.log.recoveries,preview:preview.stats(),events:events.filter(v=>v.op==='app-operation'&&v.operation==='fire'||v.op==='production-preview-observation'),scope:'One bounded native App action with actual charge/frame/release and selected renderer guide; DOM/clock doubles, no browser or full play. No suitable safe candidate means unobserved, not a game failure.'};
assert.equal(r.externalWrites.length,0);await mkdir('_local/reports/act2-complex-app-probe',{recursive:true});await writeFile(`_local/reports/act2-complex-app-probe/${id}-action.json`,JSON.stringify(r,null,2));console.log(JSON.stringify(r));
