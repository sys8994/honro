/** Registration-only Stage10 correction, checked against final production data. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {runtimeParts,runtimeEntries} from '../shared/build.mjs';
const g=vm.createContext({console,structuredClone,performance,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:false,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===10),a=p.library.find(a=>a.id==='act1-traced:stage10-floor-v4');
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex'),plain=v=>JSON.parse(JSON.stringify(v));
const built=(await runtimeEntries({vector:false,render:false,productionStory:true})).find(e=>e.project).project;
assert.equal(hash(built.stages.find(s=>s.metadata?.stageId===10)),'5b12c72408e2111aed80f33aaf9c8ef902f456dbdf2b54b4f313dd24e90fc917','Full stage changed');
assert.equal(hash(a.vector),'1a882672ea3b133b06f1deef8f3faba42a86911556d7d3dfb3be16695f320c01','Source vector changed');
assert.deepEqual(plain(a.vector.viewBox),[-4000,1300,13000,5500]);
assert.deepEqual(plain(a.collision),[]);
assert.deepEqual(plain(a.bounds),{x:-6000,y:1300,w:17000,h:26600});
assert.deepEqual(plain(a.reference.bounds),plain(a.bounds));
for(const key of ['canonicalSolid','contactInset'])for(const d of a.vector.clips[key]){
 assert(!/[^MLZ0-9eE+.,\s-]/.test(d));
 const ns=d.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g).map(Number),b=a.bounds;
 for(let i=0;i<ns.length;i+=2){assert(ns[i]>=b.x&&ns[i]<=b.x+b.w);assert(ns[i+1]>=b.y&&ns[i+1]<=b.y+b.h);}
}
const b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
assert.equal(s.terrains.length,12);assert.equal(b.terrain.length,11);
assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));
const targets=g.HonroQuestTargets.records(b).filter(t=>!t.indestructible);
assert.equal(targets.length,1);assert.equal(targets[0].id,'sodan-binding');assert.equal(targets[0].hp,3366);
const floor=g.HonroTerrainDomain.materialLandmarks(b).find(l=>l.asset?.id===a.id);
assert.deepEqual(plain(floor.asset.bounds),plain(a.bounds));
const zoom=390/6800,rs=2**(Math.floor(Math.log2(zoom*1.25)*4)/4),tileTop=512/rs;
assert.equal(tileTop,8192);assert(6800+40<tileTop);assert(a.bounds.y+a.bounds.h>tileTop);
console.log('Stage10 bounds cover full authored clips; final vector/viewBox/collision/stage unchanged. Source12/battle11 indestructible terrain plus 3366HP binding quest target preserved.');
