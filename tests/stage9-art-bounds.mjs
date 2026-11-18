/** Registration-only Stage9 correction, checked against final production data. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {runtimeParts,runtimeEntries} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===9),a=p.library.find(a=>a.id==='act1-traced:stage09-floor-v3');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const built=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(e=>e.project).project;
assert.equal(hash(built.stages.find(s=>s.metadata?.stageId===9)),'3d44b3259ef469c9701524be69a5ad4db80c8df610e620c8dcdf6510a2a6d71a','Full stage changed');
assert.equal(hash(a.vector),'194565c28c6aa13c81fa2425fc7a0e32c267863089a04665735debd0abe47b6a','Source vector changed');
assert.deepEqual(plain(a.vector.viewBox),[-4000,1500,11600,5000]);
assert.deepEqual(plain(a.collision),[]);
assert.deepEqual(plain(a.bounds),{x:-6000,y:1500,w:15600,h:26000});
assert.deepEqual(plain(a.reference.bounds),plain(a.bounds));
for(const key of ['canonicalSolid','contactInset'])for(const d of a.vector.clips[key]){
 assert(!/[^MLZ0-9eE+.,\s-]/.test(d));
 const ns=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number),b=a.bounds;
 for(let i=0;i<ns.length;i+=2){assert(ns[i]>=b.x&&ns[i]<=b.x+b.w);assert(ns[i+1]>=b.y&&ns[i+1]<=b.y+b.h);}
}
const b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
assert.equal(s.terrains.length,7);assert.equal(b.terrain.length,7);
assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
const floor=g.HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset?.id===a.id);
assert.deepEqual(plain(floor.asset.bounds),plain(a.bounds));
const zoom=390/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),tileTop=512/rs;
assert.equal(tileTop,8192);assert(6500+40<tileTop);assert(a.bounds.y+a.bounds.h>tileTop);
console.log('Stage9 bounds cover full authored clips; final vector/viewBox/collision/stage unchanged. Source7/battle7 indestructible terrain and absence of destructible quest targets preserved.');
