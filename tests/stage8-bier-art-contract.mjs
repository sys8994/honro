/** Production HP target contract; isolated Canvas call recording, not visual QA. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
import {authorStage8Bier} from '../tools/map-forge/stage8-bier.mjs';
const g=await runtime({legacyMaps:false});g.HONRO_PROJECT=await authorStage8Bier(g.HONRO_PROJECT,g,{art:false});
vm.runInContext(await readFile('shared/runtime/renderer.js','utf8'),g);const old=g.HonroScene.prototype.terrainHealth;
vm.runInContext(await readFile('shared/runtime/stage8-bier-art.js','utf8'),g);
const {b}=battlefield(g,8,{entry:false}),saved=JSON.stringify(b),scene=Object.create(g.HonroScene.prototype),rows=[];
Object.assign(scene,{x:4800,y:3800,scale:.155,battle:b});
function paint(b){const calls=[],c=new Proxy({measureText:s=>({width:String(s).length*6})},{get(t,k){return k in t?t[k]:(...a)=>calls.push([k,...a]);},set(t,k,v){t[k]=v;return true;}});scene.terrainHealth(c,b,1600,1000);return calls;}
for(const hp of[480,137,1,0]){const copy=structuredClone(b);for(const t of copy.terrain.filter(t=>t.id.startsWith('bier-knot-')))t.hp=hp;const calls=paint(copy),bars=calls.filter(c=>c[0]==='fillRect');assert.equal(bars.length,4);assert(bars.every(c=>c[3]<=76&&c[4]===5));assert.equal(calls.filter(c=>c[0]==='fillText'&&c[1]===`${hp} / 480`).length,2);rows.push({hp,twoBars:true,maximumWidth:76,noOpaquePanel:true});}
for(const field of['broken','indestructible']){const copy=structuredClone(b);for(const t of copy.terrain.filter(t=>t.id.startsWith('bier-knot-')))t[field]=true;assert.equal(paint(copy).length,0);rows.push({hidden:field});}
scene.x=-9000;assert.equal(paint(b).length,0,'Shared offscreen margins respected');scene.x=4800;
for(const change of[{honroStage8BierRevision:undefined},{honroCustom:true},{honroStage:7}]){const copy={...b,...change},calls=paint(copy);assert(calls.some(c=>c[0]==='fillRect'&&c[4]===44),'Nonactive maps retain original panels');rows.push({fallback:change});}
assert.equal(JSON.stringify(b),saved,'Rendering changes no complete battle state');assert.notEqual(g.HonroScene.prototype.terrainHealth,old);
await mkdir('_local/reports/stage8-bier',{recursive:true});await writeFile('_local/reports/stage8-bier/art-contract.json',JSON.stringify({passed:true,rows,wholeBattlePure:true},null,2));console.log('PASS Stage8 compact bars: HP, hide, offscreen, original fallback and pure state');
