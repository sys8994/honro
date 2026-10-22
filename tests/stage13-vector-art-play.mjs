// Bounded stage13 physical/interaction fixture; no combat completion claim.
import assert from 'node:assert/strict';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {traverse} from './stage17-worksite-traverse-helper.mjs';
const g=await runtime({legacyMaps:false});
g.document={getElementById:()=>null,addEventListener(){}};
vm.runInContext(await readFile('shared/runtime/interactions.js','utf8'),g);
const p=g.HONRO_CORE.defaults();p.recruited=['archer','mage','knight','occultist'];for(const cls of p.recruited)p.heroes[cls].xp=g.HonroProgression.budget(13).start;
const {b,e,app}=battlefield(g,13,{profile:p});
const u=e.heroesAlive().find(u=>u.cls==='occultist');
// Combat is isolated at initialization. The resident/spirit remain alive; the
// spirit is weakened to the actual rescue threshold. No objective is pre-set.
for(const v of b.units)if(v.side===1&&v.id!=='resident-spirit-1'){v.dead=true;v.hp=0;}
const spirit=e.unit('resident-spirit-1');spirit.hp=spirit.maxHp*.4;
b.active=u.id;e.checkEnd=()=>false;app.canInput=()=>true;
const rows=[],run=(id,route)=>{const r=traverse(g,b,e,u,route,{jump:false});rows.push({id,...r});assert(r.passed,JSON.stringify(rows.at(-1)));};
const original={x:u.x,y:u.y};
const routes=g.HONRO_PROJECT.stages[12].design.tacticalRoutes.routes;
run('entry-and-covered-approach',[{x:740,y:3003.14},...routes.find(r=>r.id==='mason-covered-approach').anchors]);
assert.equal(g.HonroAct2.current(b).id,'resident');
const resident=e.unit('resident-1'),hp=resident.hp;
assert(g.HonroInteractions.use(app,b.honroMarkers.find(m=>m.id==='resident')));
assert.equal(resident.hp,hp);assert(resident.honroResolved);assert.equal(g.HonroAct2.current(b).id,'gate');
b.active=u.id;
run('mason-to-gate',[{x:2850,y:3503},{x:3350,y:3728.125},{x:3900,y:3965},{x:4260,y:4081.8}]);
const barrier=g.HonroQuestTargets.records(b).find(t=>t.id==='gate-gate');assert(!barrier.broken);
assert(g.HonroInteractions.use(app,b.honroMarkers.find(m=>m.id==='gate')));assert(barrier.broken);assert.equal(g.HonroAct2.current(b).id,'exit');
const opened=JSON.parse(JSON.stringify(b));b.active=u.id;
run('open-door-and-inner-low-passage',[{x:4700,y:4095},...routes.find(r=>r.id==='inner-low-passage').anchors]);
assert(u.x>6500);assert.equal(g.HonroAct2.current(b).id,'exit');
const report={pass:true,scope:'Isolated production Engine walk/integrate and interaction eligibility/use. Combat disabled once; possessing spirit initialized at 40%. Original spawn, no pose correction, move budget renewed. Actual rescue/gate progression; no combat, normal turn-budget completion or full chapter win claim.',original,final:{x:u.x,y:u.y},residentHpPreserved:true,gateOpened:true,sequence:['resident','gate','exit'],rows};
await mkdir('_local/reports/stage13-vector-art',{recursive:true});await writeFile('_local/reports/stage13-vector-art/play.json',JSON.stringify(report,null,2));await writeFile('_local/reports/stage13-vector-art/opened-battle.json',JSON.stringify(opened));console.log(JSON.stringify(report));
