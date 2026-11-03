/** Port fidelity/negative-scope fixtures. NOT gameplay/clear/fun acceptance. */
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {applyAct4FinaleRevision} from '../../shared/act4-finale-revision.mjs';
const hash=v=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
const raw=JSON.parse(await readFile('shared/data/act4/world.json')),before=hash(raw),p=applyAct4FinaleRevision(raw);
assert.equal(hash(raw),before,'Author must not mutate source');
for(let id=31;id<=39;id++)assert.deepEqual(p.stages.find(s=>s.metadata.stageId===id),raw.stages.find(s=>s.metadata.stageId===id));
const s=p.stages.find(s=>s.metadata.stageId===40),original=raw.stages.find(s=>s.metadata.stageId===40);
assert.deepEqual(s.terrains,original.terrains);assert.deepEqual(s.units.filter(u=>u.team!=='enemy'),original.units.filter(u=>u.team!=='enemy'));assert.deepEqual(s.design.act4.escort,original.design.act4.escort);
assert.equal(s.units.filter(u=>u.team==='enemy').length,42);assert.equal(s.units.filter(u=>u.stageOverrides?.boss===40).length,1);assert.equal(s.units.filter(u=>u.stageOverrides?.honroMidboss).length,2);
const old=execFileSync('git',['show','7d2655bc:shared/runtime/act4-pilot-combat.js'],{encoding:'utf8'}),current=await readFile('shared/runtime/act4-pilot-combat.js','utf8');
function context(code){const g=vm.createContext({});vm.runInContext(code,g);return g.HonroAct4PilotCombat;}
const a=context(old),z=context(current);
for(const n of [31,32,33,34,35,36,37,38,39]){const b={honroAct4Preview:n,honroAct4Official:1};assert.equal(a.active(b),z.active(b));for(const boss of [0,1])for(const key of ['levee','shelf','net','harbor','wall']){const u={side:1,boss,honroPilotMidboss:key};assert.equal(a.equipped(b,u),z.equipped(b,u));}}
function fixture(P,n){const b={honroAct4Preview:n,honroAct4Official:1,round:1,phase:'enemy',teamEnds:[0,0],units:[],projectiles:[],honroAct4Design:{}},u={id:'pilot',side:1,hp:100,loadout:['HWD01'],honroPilotMidboss:P.configs[n].key,x:100,y:100,h:90,r:20,moveLeft:200,facing:1,spawnX:100,spawnY:100,honroPilotRelocation:{x:200,y:100}},hero={id:'hero',side:0,hp:100,x:300,y:100,h:90,r:20};b.units=[u,hero];const e={b,active:u,finishAction(){u.acted=true},grounded:()=>true,emit(){},settleBusy:()=>false,acceleration:()=>({y:100}),fire(id){b.projectiles.push({id:1,x:100,y:50});b.shot=1;return true}};P.action(e);u.acted=false;P.memory(u).target.seen=true;P.memory(u).target.response={id:'hero'};P.memory(u).target.seenTeamEnd=0;b.teamEnds[0]=1;P.action(e);u.acted=false;b.projectiles=[];P.action(e);return JSON.parse(JSON.stringify({b,u}));}
for(const n of [31,34,39])assert.deepEqual(fixture(a,n),fixture(z,n),'Legacy pilot action/relocation differs'+n);
const baseRevision=execFileSync('git',['show','7d2655bc:shared/runtime/campaign-map-revision.js'],{encoding:'utf8'});function rev(code){const g=vm.createContext({HonroAct4Content:{enabled:true}});vm.runInContext(code,g);return g.HonroCampaignMapRevision;}
const br=rev(baseRevision),cr=rev(await readFile('shared/runtime/campaign-map-revision.js','utf8'));for(let id=1;id<40;id++)assert.equal(br.current(id),cr.current(id));assert.equal(cr.current(40),6);
await mkdir('_local/reports/stage40-design',{recursive:true});await writeFile('_local/reports/stage40-design/scope-contract.json',JSON.stringify({scope:'Static/data and small action fixtures only; no stage gameplay claim',sourceBase:'7d2655bc',stage40Hash:hash(s),sourceWorldHash:before,unchanged31to39:true,unchangedTerrainResidentsEscort:true,count:42,major:1,mid:2,legacyPilotActionFixtures:[31,34,39],mapRevision40:6},null,2));
console.log('PASS Stage40-only author, protected geography/residents/escort,31–39 unchanged data and legacy pilot action fixtures; NOT gameplay approval');
