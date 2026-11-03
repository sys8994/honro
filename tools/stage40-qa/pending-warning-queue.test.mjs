/** Frozen captured-state A/B queue regression. No whole-stage acceptance. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import ts from '../../game/node_modules/typescript/lib/typescript.js';
import {buildCore} from '../../game/engine/build.mjs';
const baseline='96f203cb8d205b07f6c48312cbd8a20401b5d283',core=await buildCore();
const old=execFileSync('git',['show',baseline+':shared/engine/src/enemyAI.ts'],{encoding:'utf8'});
const js=ts.transpileModule(old,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,strict:true},fileName:'enemyAI.ts'}).outputText;
function load(code){const g=vm.createContext({console,performance,structuredClone});vm.runInContext(code,g);return g.HONRO_CORE;}
const A=load(core.replace('globalThis.HONRO_CORE={',`modules.enemyAI=function(module,exports,require){${js}};globalThis.HONRO_CORE={`)),B=load(core);
const captured=JSON.parse(execFileSync('xz',['-dc','tools/stage40-qa/records/41638240125-queue-input-battle.json.xz'],{maxBuffer:128e6})),id='final40-dock-right-3';
function ranks(C,source){const b=structuredClone(source),e=new C.Engine(b,()=>{},true),before=JSON.stringify(b),rows=C.rankEnemyQueue(e,e.combatEnemies()).map(p=>({id:p.unit.id,tier:p.tier,band:p.band,distance:p.distance}));assert.equal(JSON.stringify(b),before);return JSON.parse(JSON.stringify(rows));}
const records=[];function compare(name,change,expected=false){const b=structuredClone(captured);change?.(b,b.units.find(u=>u.id===id));const a=ranks(A,b),z=ranks(B,b);if(expected){assert.equal(z[0].id,id);assert.equal(z[0].tier,3);assert(!a.slice(0,b.enemyLimit).some(v=>v.id===id));assert.equal(z.slice(0,b.enemyLimit).length,b.enemyLimit);assert.deepEqual(z.filter(v=>v.id!==id),a.filter(v=>v.id!==id));}else assert.deepEqual(z,a);records.push({name,changed:expected,old:a,new:z});}
compare('actual observed/responded warning',null,true);
compare('unseen',(_,u)=>u.honroPilotCombat.target.seen=false);
compare('unanswered',(_,u)=>delete u.honroPilotCombat.target.response);
compare('same team boundary',(b,u)=>u.honroPilotCombat.target.seenTeamEnd=b.teamEnds[0]);
compare('no pilot state',(_,u)=>delete u.honroPilotCombat);
compare('guard phase',(_,u)=>u.honroPilotCombat.phase='guard');
compare('not equipped',(_,u)=>delete u.honroPilotMidboss);
compare('revision1',b=>b.honroFinalDefenseRevision=1);
compare('not official/custom',b=>{delete b.honroAct4Official;delete b.honroCustom;});
for(const stage of [31,34,39])compare('outside stage '+stage,b=>{b.honroStage=stage;b.honroAct4Preview=stage;});
compare('dead',(_,u)=>{u.dead=true;u.hp=0;});
compare('friendly',(_,u)=>u.side=0);
const helper=ts.transpileModule(await readFile('shared/engine/src/act4WarningQueue.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext}}).outputText;
const {readyFinaleWarning}=await import('data:text/javascript;base64,'+Buffer.from(helper).toString('base64'));
const b=structuredClone(captured),u=b.units.find(v=>v.id===id);assert(readyFinaleWarning(b,u));
for(const field of ['enthrall','eaterCapturedBy','carriedBy']){const z={...u,[field]:'blocked'};assert(!readyFinaleWarning(b,z));}
await mkdir('_local/reports/stage40-warning-queue-regression',{recursive:true});await writeFile('_local/reports/stage40-warning-queue-regression/result.json',JSON.stringify({baseline,scope:'Captured-state queue A/B; other-stage tests alter metadata, not full-stage gameplay',cases:records},null,2));console.log('14 queue A/B cases and controlled-actor guards passed');
