/** Display-only water domain continuation: real compiler, Engine and native pool. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createCanvas,Path2D} from '@napi-rs/canvas';
import {runtime} from '../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';
const g=await runtime({legacyMaps:false}),plain=x=>JSON.parse(JSON.stringify(x));
g.Path2D=Path2D;g.matchMedia=()=>({matches:false});
vm.runInContext(await readFile('shared/runtime/environment-art.js','utf8'),g);
const project=process.argv[2]?JSON.parse(await readFile(process.argv[2],'utf8')):plain(g.HONRO_PROJECT);
const st=project.stages.find(s=>s.metadata.stageId===(process.argv[2]?31:1));
// The optional production project exercises its exact authored pool. The default
// uses compiled Stage1 geometry and a deterministic conductive-water fixture.
if(!process.argv[2]){const t=st.terrains.find(t=>t.points?.some(p=>p.x>st.width));st.materials.push({id:'continuation-test',kind:'water',terrainId:t.id,x1:st.width-500,x2:st.width,surfaceY:0,depth:1000,conductive:true});st.design.vectorWaterContinuation={version:1,zoneId:'continuation-test',side:'right'};}
const profile=g.HONRO_CORE.defaults();profile.recruited=['archer','mage','knight','occultist'];g.HonroEquipment.fresh(profile);
const b=g.HonroMaps.createBattle(st,project,profile),D=g.HonroTerrainDomain,flag=b.honroMap.vectorWaterContinuation,z=b.honroSurfaceZones.find(z=>z.id===flag.zoneId);
assert(z?.kind==='water-pool');const saved=JSON.stringify(b),zoneSaved=JSON.stringify(z),waters=JSON.stringify(b.waters);
delete b.honroMap.vectorWaterContinuation;assert.strictEqual(D.materialWaterZone(b,z),z,'no opt-in is exact identity');
for(const bad of [{...flag,version:2},{...flag,side:'left'},{...flag,zoneId:'missing'}]){b.honroMap.vectorWaterContinuation=bad;assert.strictEqual(D.materialWaterZone(b,z),z);}
b.honroMap.vectorWaterContinuation=flag;const paint=D.materialWaterZone(b,z);assert.notStrictEqual(paint,z);assert(paint.surface.at(-1)[0]>z.surface.at(-1)[0]);assert.strictEqual(D.materialWaterZone(b,z),paint,'warm view identity');
assert.equal(JSON.stringify(b),saved,'view must not mutate compiled battle');assert.equal(JSON.stringify(z),zoneSaved);assert.equal(JSON.stringify(b.waters),waters);
b.sceneVersion++;assert.notStrictEqual(D.materialWaterZone(b,z),paint,'scene invalidates view');const v=D.materialWaterZone(b,z);b.honroWorldTerrain=plain(b.honroWorldTerrain);assert.notStrictEqual(D.materialWaterZone(b,z),v,'world replacement invalidates view');
const a={waterBaseColor:'#0c2631',waterHighlightColor:'#527771',shadowTint:'#091c27',keyLightColor:'#a6afa1',waterfallFoamColor:'#91a391'};
function pixels(zone){const cv=createCanvas(400,150),c=cv.getContext('2d'),edge=z.surface.at(-1)[0],top=z.surface[0][1];c.scale(.1,.1);c.translate(-edge+1000,-top+100);g.HonroEnvironmentArt.pool(c,zone,a,1.2);return c.getImageData(0,0,400,150).data;}
const raw=pixels(z);delete b.honroMap.vectorWaterContinuation;assert.deepEqual(pixels(D.materialWaterZone(b,z)),raw,'no flag native pixels identical');b.honroMap.vectorWaterContinuation=flag;const next=pixels(D.materialWaterZone(b,z));assert.equal(raw[(15*400+150)*4+3],0);assert(next[(15*400+150)*4+3]>0,'native water paints beyond old rectangle');
const control=plain(b);delete control.honroMap.vectorWaterContinuation;const e=new g.HONRO_CORE.Engine(b,()=>{},true),e0=new g.HONRO_CORE.Engine(control,()=>{},true);
for(let i=0;i<10;i++){D.materialWaterZone(b,z);e.integrateBody(e.active,1/60);e0.integrateBody(e0.active,1/60);}
assert.deepEqual(plain(b.waters),plain(control.waters),'conductivity unchanged');assert.deepEqual(plain(b.units),plain(control.units),'Engine integration unchanged');assert.deepEqual(plain(b.terrain),plain(control.terrain));assert.deepEqual(plain(b.zones),plain(control.zones));assert.equal(JSON.stringify(z),zoneSaved);
console.log('PASS compiled water continuation: opt-in/native coverage, baseline pixels, cache invalidation, battle/material/water immutability and Engine no-op');
