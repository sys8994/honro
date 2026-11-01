/** Restored checkpoint locomotion model. Actual collision/water; end-of-mission award is stubbed. Not browser or full-play proof. */
import assert from 'node:assert/strict';
import vm from 'node:vm';import {readFile} from 'node:fs/promises';import {execFileSync} from 'node:child_process';import {buildCore} from '../game/engine/build.mjs';
const original=JSON.parse(execFileSync('xz',['-dc','tools/act4-ci/stage31-boarding/checkpoint.json.xz'])).honroBattle;
const g=vm.createContext({console,structuredClone,performance});vm.runInContext(await buildCore(),g);g.HonroScene=class{};g.document={addEventListener(){},getElementById(){return null;}};g.HONRO_APP_READY={then(){}};const alive=u=>u&&!u.dead&&u.hp>0;g.HonroAct4TerrainPreview={launch(){},eventAPI:{alive,party:b=>b.units.filter(u=>u.side===0&&alive(u)),memory:b=>b.honroAct4PreviewState}};
for(const n of ['terrain-space','act4-coast-events'])vm.runInContext(await readFile('shared/runtime/'+n+'.js','utf8'),g);
const C=g.HONRO_CORE;const results=[];
for(const cls of ['archer','mage']){
 const b=structuredClone(original);b.active=cls;b.phase='aim';b.side=0;const e=new C.Engine(b,()=>{});e.checkEnd=()=>{};g.HonroAct4TerrainPreview.attachCoast({engine:e,dialogue:null});const u=e.unit(cls),hp=u.hp;const trace=[];
 function settle(){for(let i=0;i<360&&!e.grounded(u);i++)e.tick(C.STEP);}
 function walk(target,jump=false){if(jump)e.jump();for(let i=0;i<600&&u.x<target;i++){e.move(1,C.STEP);e.tick(C.STEP);if(b.active!==cls)break;}settle();trace.push({target,jump,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u),active:b.active});}
 walk(4815);walk(4900,true);if(u.x<4885)walk(4920,true);walk(5080);walk(5500);walk(5955);assert.ok(e.drop());for(let i=0;i<600;i++)e.tick(C.STEP);trace.push({drop:true,x:u.x,y:u.y,hp:u.hp,grounded:e.grounded(u)});assert.ok(Math.abs(u.y-2727.3)<2);walk(6480);
 assert.equal(hp-u.hp,0,cls+' must not fall into water');assert.equal(b.active,cls);assert.ok(u.x>=6480&&e.grounded(u));results.push({cls,hpLoss:hp-u.hp,trace});
}
console.log(JSON.stringify({scope:'restored R13 positions; physics/water model, quest completion stubbed; not browser/fullplay',results},null,2));
