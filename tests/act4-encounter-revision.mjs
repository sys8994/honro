/** Source preservation and native idle-placement checks, not gameplay acceptance. */
import assert from 'node:assert/strict';import {readFile,writeFile,mkdir} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {applyAct4EncounterRevision,supportPoint} from '../shared/act4-encounter-revision.mjs';import {runtime} from '../game/tests/helpers.mjs';import {loadPilotRuntime} from '../tools/stage31/pilot-runtime.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const original=JSON.parse(await readFile('shared/data/act4/world.json','utf8')),before=JSON.stringify(original),candidate=applyAct4EncounterRevision(original),hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
assert.equal(JSON.stringify(original),before);assert.equal(JSON.stringify(applyAct4EncounterRevision(candidate)),JSON.stringify(candidate),'idempotent author revision');
for(const s of candidate.stages){const old=original.stages.find(v=>v.id===s.id);for(const key of Object.keys(old).filter(k=>!['units','encounters','initialState',...(s.metadata.stageId===40?['design']:[])].includes(k)))assert.equal(hash(s[key]),hash(old[key]),'Protected field '+s.id+'.'+key);assert.deepEqual(s.units.filter(u=>u.team!=='enemy'),old.units.filter(u=>u.team!=='enemy'));}
const g=await runtime({legacyMaps:false,productionStory:true});await loadPilotRuntime(g);const rows=[];
function differences(a,b,p='',out=[]){if(Object.is(a,b))return out;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))differences(a[k],b[k],p+'.'+k,out);}else out.push({path:p,actual:a,expected:b});return out;}
for(const s of candidate.stages){const actual=JSON.parse(JSON.stringify(g.HONRO_PROJECT.stages.find(v=>v.id===s.id))),expected=JSON.parse(JSON.stringify(s));for(const key of ['honroNarrativeRevision','honroStoryCanonRevision','honroNarrativeCatalogueRevision']){if(expected.initialState[key]===undefined){assert.equal(actual.initialState[key],1,'Known canonical narrative default');expected.initialState[key]=1;}}const diff=differences(actual,expected);if(diff.length)console.log('SOURCE_DIFF',s.id,JSON.stringify(diff.slice(0,12)));assert.equal(diff.length,0,'Shared runtime must use exact authored candidate '+s.id);}

for(const n of [32,33,34,35,36,37,38,39]){
 const s=candidate.stages.find(s=>s.metadata.stageId===n),p=g.HonroMaps.profileFor(s);g.HonroEquipment.fresh(p);const b=g.HonroMaps.createBattle(s,candidate,p,{origin:'campaign'}),e=new g.HONRO_CORE.Engine(b,()=>{},true);g.HonroAct4PilotCombat.attach({engine:e});g.HonroEncounterDensity.installActivation(e);e.refreshActivation();
 const minis=b.units.filter(u=>u.honroMidboss),expected={32:0,33:1,34:1,35:1,36:0,37:2,38:2,39:1}[n];assert.equal(minis.length,expected);assert(minis.every(u=>g.HonroAct4PilotCombat.equipped(b,u)),'Every miniboss must execute actual pilot behavior');
 for(const u of minis){const t=u.honroPilotRelocation;assert(t&&Math.hypot(t.x-u.x,t.y-u.y)>60,'Meaningful relocation '+u.id);const supported=supportPoint(s,u.honroEncounterSupport,t.x);assert(Math.abs(supported.y-t.y)<.01);}
 if([33,35].includes(n)){
  // Explicit native mechanics fixture, not player/UI warning observation.
  const trial=g.HonroMaps.createBattle(s,candidate,p,{origin:'campaign'}),te=new g.HONRO_CORE.Engine(trial,()=>{},true),actor=trial.units.find(u=>u.honroMidboss);g.HonroAct4PilotCombat.attach({engine:te});
  const target=trial.units.find(u=>u.side===0);Object.assign(target,supportPoint(s,actor.honroEncounterSupport,actor.x-250),{vx:0,vy:0});
  Object.assign(trial,{active:actor.id,side:1,phase:'enemy',queue:[actor.id]});actor.acted=false;actor.awake=true;
  g.HonroAct4PilotCombat.action(te);assert.equal(actor.honroPilotCombat.phase,'telegraph');
  const warning=actor.honroPilotCombat.target;Object.assign(warning,{seen:true,seenTeamEnd:trial.teamEnds?.[0]||0,response:{id:trial.units.find(u=>u.side===0).id}});trial.teamEnds??=[0,0];trial.teamEnds[0]=warning.seenTeamEnd+1;
  Object.assign(trial,{active:actor.id,side:1,phase:'enemy',queue:[actor.id]});actor.acted=false;actor.moveTarget=undefined;actor.aiMove=undefined;
  g.HonroAct4PilotCombat.action(te);assert(trial.projectiles.some(p=>p.skill===(n===33?'HSH02':'HWD01')),'Native variant must cast actual skill '+n);
  const beforeHp=target.hp;for(let i=0;i<600&&trial.projectiles.length;i++)for(const shot of [...trial.projectiles])if(trial.projectiles.includes(shot))te.stepProjectile(shot,g.HONRO_CORE.STEP);assert(target.hp<beforeHp,'Native projectile must actually hit fixture target');if(n===33){assert.equal(target.bound,1);te.newRound();assert.equal(target.moveLeft,target.maxMove*.45);Object.assign(trial,{active:target.id,side:0,phase:'aim'});te.finishAction(true);assert.equal(target.bound,0,'One own action ends the binding');te.newRound();assert.equal(target.moveLeft,target.maxMove);assert(target.hp>0,'Control fixture retains counterplay');}

 }
 const poses=new Map(minis.map(u=>[u.id,{x:u.x,y:u.y,hp:u.hp}]));for(let i=0;i<120;i++)e.tick(g.HONRO_CORE.STEP);
 for(const u of minis){assert.equal(u.hp,poses.get(u.id).hp);assert(Math.hypot(u.x-poses.get(u.id).x,u.y-poses.get(u.id).y)<12,'Unstable placement '+u.id);}
 if(n===36){assert.equal(b.units.filter(u=>u.side===1).length,6);const reward=b.units.find(u=>u.id==='a4-36-b-1');assert(reward?.elite);assert(!s.units.some(u=>u.team==='enemy'&&u.stageOverrides.honroEncounterSupport==='approved36-court'));assert.equal(b.enemyLimit,2);}
 rows.push({stage:n,enemies:b.units.filter(u=>u.side===1).length,minibosses:minis.map(u=>({id:u.id,variant:u.honroPilotVariant||'arc',key:u.honroPilotMidboss,relocation:u.honroPilotRelocation})),activationCells:Object.keys(b.honroEncounterDensityActivation).length});
}
await mkdir('_local/reports/act4-encounter-revision',{recursive:true});await writeFile('_local/reports/act4-encounter-revision/placement.json',JSON.stringify({scope:'Authoring/native idle fixtures only. No difficulty, complete play or art acceptance.',rows},null,2));console.log(JSON.stringify(rows));
