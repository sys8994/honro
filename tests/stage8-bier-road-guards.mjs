/** Stage8 bier road: authored jangseung stay off the moving body's landing and
 * road, and a flier's reserved flight envelope is reported as that enemy.
 * Explicit isolated fixtures (heroes/fliers placed by the test); NOT normal play
 * or browser evidence. Normal-input comparisons are in game/docs/STAGE8_BIER_ROAD_2026-11-08.md. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {currentBierEntryProfile} from './stage8-current-entry-helper.mjs';
import {bierEncounterSeeds,bierY} from '../tools/map-forge/stage8-bier.mjs';
const h=await appHarness(),{g,C}=h,S=g.HonroStage8Bier,rows=[];
let now=10000;g.performance={now:()=>now};
const project=JSON.parse(await readFile('shared/data/campaign.json')),stage=project.stages.find(s=>s.metadata?.stageId===8);
// Authored source and canonical data agree for every Stage8 enemy seed.
const seeds=new Map(bierEncounterSeeds('density36e9').map(r=>[r.id,r]));
for(const u of stage.units.filter(u=>u.team==='enemy'&&seeds.has(u.id))){const r=seeds.get(u.id);assert.equal(u.x,r.x,u.id);assert.equal(u.y,r.y,u.id);assert.equal(u.stageOverrides.honroEncounterSupport,r.support,u.id);}
assert.deepEqual([seeds.get('s8-15').support,seeds.get('s8-30').support],['s8-east-plinth','s8-ground']);rows.push('forge seeds equal canonical campaign enemies; s8-15/s8-30 authored off the bier road');
function fresh(){const app=h.load({...plain(g.AppRegression.fresh()),...plain(currentBierEntryProfile(g).profile)});app.launch(8);h.finish(app);now+=3000;const e=app.engine,b=e.b;app.dialogue=null;b.projectiles=[];b.volley=null;for(const t of g.HonroQuestTargets.records(b).filter(t=>t.honroSeal)){t.broken=true;t.hp=0;}return{app,e,b};}
{const {e,b}=fresh(),boss=b.units.find(u=>u.id==='boss'),mv=b.honroStage8BierSpec.movement;
 assert.equal(b.honroStage8BierRevision,1);const s15=b.units.find(u=>u.id==='s8-15'),s30=b.units.find(u=>u.id==='s8-30');
 assert(s15.loadout.includes('HWD02')&&s15.honroMonsterEffectSkill==='HWD02','HWD02 pilot stays on s8-15');assert(s30.elite);
 // Neither guard occupies either landing body.
 for(const to of mv.destinations){const ids=S.bodyBlockers(e,{...boss,x:to.x,y:to.y}).map(v=>v.id);assert(!ids.includes('s8-15')&&!ids.includes('s8-30'),to.id+' '+ids);}
 // With every other living actor removed, the authored road from the boss's
 // actual pose to the courtyard is clear of both guards and of terrain.
 b.units=b.units.filter(u=>['boss','s8-15','s8-30'].includes(u.id));const route=S.chooseRoute({engine:e});assert(!route.blocked,JSON.stringify(route.blocked));
 rows.push(`fresh guards (${Math.round(s15.x)},${Math.round(s15.y)}) and (${Math.round(s30.x)},${Math.round(s30.y)}) leave landing and road clear`);}
{const {e,b}=fresh(),boss=b.units.find(u=>u.id==='boss');
 // Old authored positions block (negative control: the check can fail).
 const s15=b.units.find(u=>u.id==='s8-15');Object.assign(s15,{x:5950,y:bierY('s8-court',5950)});b.units=b.units.filter(u=>['boss','s8-15','s8-16'].includes(u.id));
 const route=S.chooseRoute({engine:e});assert(route.blocked?.some(v=>v.id==='s8-15'),JSON.stringify(route.blocked));rows.push('negative control: old s8-15 landing guard plus authored s8-16 near the alternate block the bier');}
{const {e,b}=fresh(),boss=b.units.find(u=>u.id==='boss');
 // A flier hovering over the road: engine ground walking refuses its envelope.
 const lantern=b.units.find(u=>u.id==='s8-17');assert(C.flyingEnemy(lantern),'s8-17 is a flier');Object.assign(lantern,{x:6547,y:3778});
 b.units=b.units.filter(u=>['boss','s8-17'].includes(u.id));const route=S.chooseRoute({engine:e});
 assert.deepEqual(Array.from(route.blocked||[],v=>v.kind+':'+v.id),['enemy:s8-17'],JSON.stringify(route.blocked));
 lantern.dead=true;lantern.hp=0;assert(!S.chooseRoute({engine:e}).blocked,'clear once that flier is gone');rows.push('flier envelope on the road is named as that enemy, not a terrain gap; clears when it is gone');}
{const {app,e,b}=fresh(),boss=b.units.find(u=>u.id==='boss');
 // Companions on the road are listed together; one behind the bier is not.
 const put=(id,surface,x)=>Object.assign(b.units.find(u=>u.id===id),{x,y:bierY(surface,x)});put('p-archer','s8-court',7000);put('p-mage','s8-court',6400);put('p-knight','s8-ground',8650);
 b.units=b.units.filter(u=>u.side===0||u.id==='boss');const route=S.chooseRoute(app),shown=Array.from(S.withRoadHeroes(app,route.blocked)||[],v=>v.kind+':'+v.id).sort();
 assert.deepEqual(shown,['hero:p-archer','hero:p-mage'],JSON.stringify(shown));rows.push('all companions standing on the road are named together; one behind the bier is not');}
await report('Stage8 bier road guards',rows);console.log('PASS Stage8 bier road guards',rows);
