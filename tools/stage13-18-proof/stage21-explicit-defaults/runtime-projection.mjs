/** Models only exact active normal engine terrain/contact path, no full app/Pixels. */
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base=process.argv[2];
const read=name=>readFileSync(base+'/'+name,'utf8');
const hash=x=>createHash('sha256').update(x).digest('hex');
const core=read('active-core.mjs'), a=JSON.parse(read('stage21-compiled.json')), b=JSON.parse(read('stage21-fixture-new.json'));
assert.equal(hash(core).slice(0,16),'49982d8a68cfa528');
assert.equal(hash(read('stage21-compiled.json')).slice(0,16),'724a765a85d437a2');
assert.equal(a.terrains.length,23);assert.equal(b.terrains.length,23);
const g=vm.createContext({console,structuredClone,performance});
const coreBody=core.replace(/^import\{yieldIfNeeded\}from"\.\/load-data\.[a-f0-9]+\.js";/,'').replace(/await yieldIfNeeded\(\);\s*$/,'');
assert(!coreBody.includes('import{yieldIfNeeded}')&&!coreBody.endsWith('await yieldIfNeeded();'));
vm.runInContext(coreBody,g,{filename:'official-active-core-without-web-import-yield'});
for(const f of ['map-engine.js','geometry.js','terrain-domain.js','environment.js','schema.js'])vm.runInContext(read(f),g,{filename:f});
const Q=g.HonroGeometry,TD=g.HonroTerrainDomain,C=g.HONRO_CORE;
const defaultSample=g.HonroMaps.normalize({version:6,environmentVersion:4,stages:[a],library:[]}).stages[0];
assert.equal(JSON.stringify(defaultSample),JSON.stringify(b),'Typed insertion equals exact schema normalization for this stage fixture');
function project(st){
 const base=st.terrains.map(t=>Q.terrain(t,st.height));
 const world=st.terrains.map(t=>({...Q.terrain(t,st.height,true),...(t.playProjection?{honroDomainProjection:structuredClone(t.playProjection)}:{})}));
 const checks=[];
 for(const row of base){
  const xs=[row.x+row.w*.12,row.x+row.w*.5,row.x+row.w*.88,...row.vertices.map(v=>v.x)];
  for(const x of xs)
   checks.push({id:row.id,x,surfaces:C.terrainSurfaces(row,x),y:g.HonroMapEngine.surfaceY(base,x,undefined,row.id)});
 }
 const unitContacts=st.units.map(u=>[u.id,g.HonroMapEngine.surfaceY(base,u.x,u.y),g.HonroMapEngine.surfaceY(base,u.x,u.y,u.stageOverrides?.honroEncounterSupport)]);
 const domainValid=Array.from(TD.validate(st));
 const model={base,world,checks,unitContacts,domainValid};
 return {count:base.length,surfaceChecks:checks.length,unitSites:unitContacts.length,gradeSHA256:hash(JSON.stringify(model)),model};
}
const pa=project(a),pb=project(b);
assert.equal(JSON.stringify(pa),JSON.stringify(pb));
assert.equal(pa.model.domainValid.length,0);
const {model,...rest}=pa;
console.log(JSON.stringify({sourceStage:[a.width,a.height],onlyTypedDefaults:23,sourceStageNormalizedEqualsCandidate:true,inputStockDoesNotStoreDetail:a.terrains.every(t=>!Object.hasOwn(t,'detail')),candidateCompiledGeometryUnchanged:true,exactActiveCoreSHA256:hash(core),localCollisionSHA256:hash(JSON.stringify(model.base)),worldProjectionSHA256:hash(JSON.stringify(model.world)),...rest},null,2));
