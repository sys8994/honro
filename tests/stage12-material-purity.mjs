import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {createCanvas,Path2D,DOMMatrix} from '@napi-rs/canvas';
import {runtimeParts} from '../shared/build.mjs';

const canvas=(w=64,h=64)=>createCanvas(w,h);
const g=vm.createContext({console,performance,structuredClone,Path2D,DOMMatrix,document:{createElement:()=>canvas()},navigator:{userAgent:'native-landscape-contract'},matchMedia:()=>({matches:true})});g.window=g;
for(const source of await runtimeParts({vector:true,render:true}))vm.runInContext(source,g);
const art=g.HonroStage12QuarryArt,p=g.HONRO_PROJECT,s=p.stages.find(s=>s.metadata.stageId===12),b=g.HonroMaps.createBattle(s,p);
assert(art.active(b));assert(!art.active({...b,honroStage:11}));assert(!art.active({...b,honroQuarryRevision:undefined}));
const original=JSON.stringify(b),ts=g.HonroTerrainDomain.render(b),c=canvas(1400,900).getContext('2d');
c.setTransform(.08,0,0,.08,10,20);const matrix=()=>{const m=c.getTransform();return[m.a,m.b,m.c,m.d,m.e,m.f];},before=matrix();let drawn=0;
for(const t of ts){if(!t.honroQuarry)continue;assert.equal(art.prepare(t,b),art.prepare(t,b));assert(art.terrain(c,t,b));assert.deepEqual(matrix(),before);assert.equal(c.globalAlpha,1);drawn++;}
assert(drawn>=10);assert.equal(JSON.stringify(b),original,'Painting may not change physics, objectives or saved state');
const l=b.honroLandmarks.find(l=>l.id==='sq-art-recessed-mother-rock');assert(l);art.rear(c,l);assert.deepEqual(matrix(),before,'Rear bearing pass leaks no transform');assert.equal(c.globalAlpha,1);assert.equal(JSON.stringify(b),original,'Rear drawing is not collision or saved state');
const t=ts.find(t=>t.honroQuarry),q=art.prepare(t,b);assert.notEqual(art.prepare(t,{...b,sceneVersion:(b.sceneVersion||0)+1}),q);
assert.equal(art.terrain(c,t,{...b,honroQuarryRevision:undefined}),false);
console.log(JSON.stringify({pass:true,drawn,purity:true,cache:true,invalidation:true,optOut:true}));
