/** Final compact Stage12: preserve originals, extend only off-map material end. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';
import {extendStage12GroundSkirt} from '../tools/environment/stage12-compact-art.mjs';
const sha=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex'),plain=x=>JSON.parse(JSON.stringify(x));
const pkg=JSON.parse(readFileSync('shared/data/act2/stage12-compact-package.json','utf8'));
assert.equal(sha(pkg.stage),'389af90432c72d18d348d0ab87091c7cde7216607627e09e6801a92efb8ade11');
assert.equal(sha(pkg.source),'273ac565a4d3e44366df10dff355ba1759ab6d51b3dc75356df6f8fe698f91fa');
assert.equal(sha(pkg.assets.filter(a=>!a.id.includes('stage12-ground-'))),'b2b0cc5b8fdb8c80c326efd83953157f28213f1c296d1dc4754c0eb24748970a');
const originals=['64cbb33a946d123e8073accf3987c08605b1b6cc45dba5597495a73f88799a95','b46cb198a96adf01fb8a18dce1dbc2e1f7fddaf112350db296776703c5b3ee98'];
const assets=pkg.assets.filter(a=>a.id.includes('stage12-ground-'));
assert.equal(assets.length,2);
for(const [i,a]of assets.entries()){
 const core=structuredClone(a),v=core.vector,tail=v.symbols['compact12-ground-tail-source'];assert(tail);assert.equal(tail.children.length,8);
 delete v.symbols['compact12-ground-tail-source'];v.root.children=v.root.children.filter(n=>!n.clipPath.endsWith('-tail'));
 for(const k of Object.keys(v.clips))if(k.endsWith('-tail'))delete v.clips[k];
 assert.equal(sha(v),originals[i],'Original vector paths/placements/clip contracts changed');
 assert.deepEqual(extendStage12GroundSkirt(core),a,'Generator and serialized package disagree');
 assert.deepEqual(a.collision,[]);
 for(const n of a.vector.root.children.filter(n=>n.clipPath.endsWith('-tail'))){
  const sourceTop=4400+735*10.869565217391305;
  const top=n.transform[3]*sourceTop+n.transform[5];
  assert(Math.abs(top-10498)<1e-7);assert(top>pkg.stage.height);
  assert(Math.abs(n.transform[3]*12400+n.transform[5]-30100)<1e-7);
 }
}
const g=vm.createContext({console,structuredClone,performance,Path2D,DOMMatrix,setTimeout,clearTimeout});g.window=g;
for(const source of await runtimeParts({vector:true,render:false,productionStory:true}))vm.runInContext(source,g);
const p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata?.stageId===12),b=g.HonroMaps.createBattle(s,p);g.HonroStageRules.sanitizeStageBattle(b);new g.HONRO_CORE.Engine(b,()=>{},true);
assert.equal(s.initialState.honroAct2CompactRevision,1);assert.equal(s.terrains.length,12);assert.equal(b.terrain.length,12);
assert(b.terrain.every(t=>t.indestructible&&t.hp===99999));assert.equal(g.HonroQuestTargets.records(b).filter(t=>!t.indestructible).length,0);
for(const a of assets){const final=p.library.find(x=>x.id===a.id);assert(final);assert.deepEqual(plain(g.HonroVectorArt.validate(final.vector)),[],'Final optimized node/compound budget');}
console.log('Stage12 skirt PASS: original source/paths/stage/other assets unchanged, generator/package agree, two final vectors validate, 12 indestructible terrains preserved.');
