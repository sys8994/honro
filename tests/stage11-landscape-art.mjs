import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';

const canvas=(w=64,h=64)=>createCanvas(w,h);
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>canvas()},navigator:{userAgent:'native-landscape-contract'},matchMedia:()=>({matches:true})});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
// A test may run before the integrator installs the shared manifest hook.
if(!g.HonroStage11LandscapeArt)vm.runInContext(await readFile(new URL('../shared/runtime/stage11-landscape-art.js',import.meta.url),'utf8'),g);
const art=g.HonroStage11LandscapeArt,p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata.stageId===11),b=g.HonroMaps.createBattle(s,p);
assert.equal(art.active({honroStage:11}),false);
assert.equal(art.active({...b,honroStage11LandscapeRevision:undefined}),false);
assert.equal(art.active({...b,honroStage:12,honroStage11LandscapeRevision:1}),false);
assert.equal(art.active({...b,honroStage11LandscapeRevision:1}),true);
const legacy={...b,honroStage11LandscapeRevision:undefined},cv=canvas(1400,900),c=cv.getContext('2d');
assert.equal(art.terrain(c,b.terrain[0],legacy),false);
b.honroStage11LandscapeRevision=1;
const original=JSON.stringify(b),ts=g.HonroTerrainDomain.render(b);let drawn=0,maxPreparedPaths=0;
c.setTransform(.06,0,0,.06,10,20);
const transform=()=>{const m=c.getTransform();return[m.a,m.b,m.c,m.d,m.e,m.f];},beforeTransform=transform();
for(const t of ts){
 if(!t.honroRavine)continue;
 const a=art.prepare(t,b);assert.equal(a,art.prepare(t,b),'prepare cache must reuse paths');
 maxPreparedPaths=Math.max(maxPreparedPaths,a.plates.length+a.bands.length+a.grooves.length+a.moss.length+2);
 assert.equal(art.terrain(c,t,b),true);drawn++;
 assert.deepEqual(transform(),beforeTransform,'material pass leaked its Canvas transform');
 assert.equal(c.globalAlpha,1,'material pass leaked alpha');
}
assert.ok(drawn>=30);assert.ok(maxPreparedPaths<150,'unbounded material path count');
assert.equal(JSON.stringify(b),original,'rendering changed the live battle');
const t=ts.find(t=>t.honroRavine),old=art.prepare(t,b),next={...b,sceneVersion:(b.sceneVersion||0)+1};assert.notEqual(art.prepare(t,next),old,'scene invalidation must reprepare live geometry');
for(const a of p.library.filter(a=>a.id.startsWith('stage11:')&&a.vector))assert.deepEqual(Array.from(g.HonroVectorArt.validate(a.vector)),[],a.id);
console.log(JSON.stringify({pass:true,drawn,maxPreparedPaths,purity:true,cache:true,oldBattleOptOut:true,otherStagesOptOut:true}));
