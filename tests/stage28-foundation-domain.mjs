/** Source-only buried floor extension. No user save or browser access. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runtimeParts} from '../shared/build.mjs';
import {applyStage28RecordCourt} from '../tools/map-forge/stage28-record-court.mjs';
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const g=vm.createContext({console,performance,structuredClone});
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===28),t=s.terrains.find(t=>t.id==='a3-foundation');
assert.equal(s.terrainBounds.bottom,27400);assert.deepEqual(JSON.parse(JSON.stringify(t.points.slice(-2))),[{x:16200,y:27400},{x:-9000,y:27400}]);
assert.equal(t.playProjection.bounds.bottom,9000);
const old=structuredClone(s);old.terrains.find(t=>t.id==='a3-foundation').points.slice(-2).forEach(q=>q.y=9000);
const oldT=old.terrains.find(t=>t.id==='a3-foundation');
assert.equal(JSON.stringify(g.HonroTerrainDomain.projection(t)),JSON.stringify(g.HonroTerrainDomain.projection(oldT)));
const before=g.HonroMaps.compile(old,p),after=g.HonroMaps.compile(s,p);
assert.equal(JSON.stringify(before.terrain),JSON.stringify(after.terrain),'Compiled collision changed');
assert.equal(JSON.stringify(before.units),JSON.stringify(after.units),'Compiled units changed');
assert.equal(JSON.stringify(oldT.properties.honroWalkEdges),JSON.stringify(t.properties.honroWalkEdges));
const a=g.HonroMaps.createBattle(old,p),b=g.HonroMaps.createBattle(s,p);
assert.equal(JSON.stringify(a.terrain),JSON.stringify(b.terrain),'Battle collision changed');
assert.equal(JSON.stringify(a.units),JSON.stringify(b.units),'Battle units changed');
// Run both source authors on the same compact input. Reverse only the new
// declaration/point tokens to reconstruct the exact known baseline author.
const url=new URL('../tools/map-forge/stage28-record-court.mjs',import.meta.url);
const current=await readFile(url,'utf8');
let legacy=current.replace(' // Continue only the buried source mass; the collision projection below stays at 9000.\n const foundationBottom=Math.max(9000,s.terrainBounds?.bottom??9000);\n','').replace('[16200,foundationBottom],[-9000,foundationBottom]','[16200,9000],[-9000,9000]');
assert.equal(createHash('sha256').update(legacy).digest('hex'),'54cd7353c1e2e9b26bd8b0edc0b0f82128d0ae0588a45696ae2788ed899b1c55');
legacy=legacy.replace(/from '\.\/([^']+)'/g,(_,f)=>`from '${new URL(f,url).href}'`);
const {applyStage28RecordCourt:baselineAuthor}=await import('data:text/javascript;base64,'+Buffer.from(legacy).toString('base64'));
const input={...p,stages:p.stages.map(v=>v===s?old:v)},inputHash=hash(input),baseline=baselineAuthor(input),candidate=applyStage28RecordCourt(input);
assert.equal(hash(input),inputHash,'Author mutated input');
const restored=structuredClone(candidate);restored.stages.find(v=>v.metadata?.stageId===28).terrains[0].points.slice(-2).forEach(q=>q.y=9000);
assert.equal(hash(restored),hash(baseline),'Author changes beyond the two buried vertices');
assert.equal(JSON.stringify(g.HonroTerrainDomain.validate(s)), '[]');
console.log(JSON.stringify({passed:true,stage:28,sourceBottom:27400,projectionBottom:9000,onlyTwoBuriedVertices:true,compiledCollisionUnchanged:true,battleCollisionAndUnitsUnchanged:true,walkEdgesUnchanged:true,authorInputUnchanged:true,physicsHash:hash({terrain:b.terrain,units:b.units}),scope:'Production author/build/compiler model checks; no existing save mutation, browser or full gameplay claim.'}));
