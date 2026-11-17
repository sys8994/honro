/** Registration-only Stage8 correction, checked against final production data. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {runtimeParts,runtimeEntries} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===8),a=p.library.find(a=>a.id==='act1-traced:stage08-floor-v1');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const built=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(e=>e.project).project;
assert.equal(hash(built.stages.find(s=>s.metadata?.stageId===8)),'d2b17bd7746cede48776fc7608c69d7b5f0f64972fc87e70c96433468a401daf','Full stage changed');
assert.equal(hash(a.vector),'567bca69c2ce81871e74758a5fab170ace4500570217fb8775d0b24d992c2d6d','Source vector changed');
assert.deepEqual(plain(a.vector.viewBox),[-4000,1800,17600,6000]);
assert.deepEqual(plain(a.collision),[]);
assert.deepEqual(plain(a.bounds),{x:-6000,y:1800,w:21600,h:27700});
assert.deepEqual(plain(a.reference.bounds),plain(a.bounds));
for(const key of ['canonicalSolid','contactInset'])for(const d of a.vector.clips[key]){
 assert(!/[^MLZ0-9eE+.,\s-]/.test(d));
 const ns=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number),b=a.bounds;
 for(let i=0;i<ns.length;i+=2){assert(ns[i]>=b.x&&ns[i]<=b.x+b.w);assert(ns[i+1]>=b.y&&ns[i+1]<=b.y+b.h);}
}
const b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
assert.equal(s.terrains.length,22);assert.equal(b.terrain.length,20);
assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
const knots=g.HonroQuestTargets.records(b).filter(t=>/^bier-knot-[01]$/.test(t.id));
assert.equal(knots.length,2);assert(knots.every(t=>t.hp===480&&!t.indestructible));
const floor=g.HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset.id===a.id);
assert.deepEqual(plain(floor.asset.bounds),plain(a.bounds));
const zoom=390/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),tileTop=512/rs;
assert.equal(tileTop,8192);assert(7800+40<tileTop);assert(a.bounds.y+a.bounds.h>tileTop);
console.log('Stage8 bounds cover full authored clips; final vector/viewBox/collision/stage unchanged. Source22/battle20 plus two destructible 480HP quest targets preserved.');
