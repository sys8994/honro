/** Check that frozen historical DATA still exercises current code, and that
 * current airspace remains independently guarded. Mutants exist only in VM text. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtimeParts} from '../shared/build.mjs';
import {battlefield} from '../game/tests/helpers.mjs';
const parts=await runtimeParts({vector:false,render:false});
const fixture=JSON.parse(await readFile('tests/fixtures/stage2-legacy-escape-381afda0.json'));
assert.equal(fixture.captureSha256,'df984931b70e6cc612d0f80d7ddfd8c3067828e92cba216969a0905a149c2fa4');
assert.equal(createHash('sha256').update(JSON.stringify(fixture.battle)).digest('hex'),fixture.captureSha256,'Historical fixture bytes match the captured original test state');
function load(replacement){let replacements=0;const g=vm.createContext({console,performance,structuredClone});for(let source of parts){if(replacement&&source.includes(replacement[0])){assert.equal(source.split(replacement[0]).length-1,1);source=source.replace(...replacement);replacements++;}vm.runInContext(source,g);}assert.equal(replacements,replacement?1:0);return g;}
function legacy(g){const b=structuredClone(fixture.battle),e=new g.HONRO_CORE.Engine(b),u=e.unit('foe-1-cluster'),C=g.HONRO_CORE;
 assert(!C.flightClear(e,u,u));const hp=u.hp,move=u.moveLeft,plan=C.planEnemyMove(e,u,e.heroesAlive()[0]);assert(plan?.flightEscape,'Current planner must supply historical escape');u.aiMove=plan;
 for(let i=0;i<300&&u.aiMove;i++)C.advanceEnemyMove(e,u,C.STEP);
 assert(C.flightClear(e,u,u),'Current movement must actually clear old collision');assert.equal(u.hp,hp);assert(move-u.moveLeft>0&&move-u.moveLeft<=192,'Escape must pay bounded movement');return {x:u.x,y:u.y,cost:move-u.moveLeft};}
function current(g){const {b,e}=battlefield(g,2),C=g.HONRO_CORE,u=b.units.find(g.HonroStage2Airborne.roost);assert.equal(b.enemyLimit,4);for(const v of b.units.filter(g.HonroStage2Airborne.roost))assert(C.flightClear(e,v,v));
 const probe={x:1800,y:400};assert(probe.x<b.honroMap.flightRegion.left);assert(!C.flightClear(e,u,probe),'Current authored airspace must reject the outside probe');return {region:b.honroMap.flightRegion,probe};}
const live=load(),result={scope:'Current compiled source in isolated VMs; no product file edits and no normal-play claim',legacy:legacy(live),current:current(live),mutants:[]};
const noEscape=load(['flightEscape: true','flightEscape: false']);assert.throws(()=>legacy(noEscape),/Current planner must supply historical escape/);result.mutants.push('Current escape marker regression detected');
const noRegion=load(['if (region &&','if (false &&']);assert.throws(()=>current(noRegion),/Current authored airspace must reject the outside probe/);result.mutants.push('Current authored flight-region regression detected independently of historical data');
await mkdir('_local/reports/stage02-current',{recursive:true});await writeFile('_local/reports/stage02-current/guard-sensitivity.json',JSON.stringify(result,null,2));console.log('PASS',JSON.stringify(result));
