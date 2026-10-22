/** Compare actual drawing commands to the historic renderer, not copied constants. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import ts from '../game/node_modules/typescript/lib/typescript.js';
import {buildCore} from '../game/engine/build.mjs';
const original='be79826869c70ae68950eb8be8a4bd7d187600dc',first='b1e4efc41d91107a037ba23977532f546c57f948',base='d33402627e0c632593a388ec19e0b5370cc68439';
const historic=ref=>execFileSync('git',['show',`${ref}:shared/engine/src/skillVisuals.ts`],{encoding:'utf8'});
const plain=x=>JSON.parse(JSON.stringify(x));
function reference(source){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:()=>({})});return exports;}
const old=reference(historic(original)),initial=reference(historic(first)),reduced=reference(historic(base));
const g=vm.createContext({console,performance});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE;
function trace(draw,size,t,point){const strokes=[],fills=[],gradients=[];let path=[];
 const c={save(){},restore(){},setLineDash(){},beginPath(){path=[];},moveTo(x,y){path.push([x,y]);},lineTo(x,y){path.push([x,y]);},stroke(){strokes.push({path:plain(path),width:this.lineWidth,alpha:this.globalAlpha,color:this.strokeStyle});},createRadialGradient(...args){const stops=[];gradients.push({args,stops});return {addColorStop(...v){stops.push(v);}};},arc(...args){path.push(args);},fill(){fills.push({path:plain(path),alpha:this.globalAlpha});}};
 draw(c,...point,size,t);return {strokes,fills,gradients};}
const rows=[];
for(const point of [[1000,-170,1000,940],[31,20,31,55],[200,180,550,650]])for(const t of [0,.02,.08,.25,.6,.98,1]){
 const actual=trace(C.drawLightningBolt,3.5,t,point),expected=trace(old.drawLightningBolt,3.5,t,point);
 assert.deepEqual(actual,expected,'same paths, color, alpha, glow, discharges and timing as original at size3.5');
 assert.deepEqual(actual,trace(initial.drawLightningBolt,3.5,t,point),'first per-target renderer preserved');
 const wide=trace(old.drawLightningBolt,5,t,point);
 if(actual.strokes.length){assert.equal(actual.strokes.length,37,'four layers × (trunk + six forks), nine discharges');
  for(let i=0;i<28;i++)assert(Math.abs(actual.strokes[i].width/wide.strokes[i].width-.7)<1e-12,'all trunk/fork layers exactly 30% narrower');
  assert.deepEqual(actual.strokes.slice(28),wide.strokes.slice(28),'original sparks unchanged');}
 // All non-M05 consumers use the identical pre-fix default draw behavior.
 assert.deepEqual(trace(C.drawLightningBolt,2.8,t,point),trace(reduced.drawLightningBolt,2.8,t,point),'M04/default consumer unchanged');
 rows.push({point,t,strokes:actual.strokes.length});
}
for(const phase of [0,1,2])for(const point of [[1000,-170,1000,940],[10,20,10,22],[25,80,450,400]]){
 assert.deepEqual(plain(C.lightningPaths(...point,phase)),plain(old.lightningPaths(...point,phase)));
 assert.equal(C.lightningPaths(...point,phase).forks.length,6);
}
assert.equal(C.SKILL_FX_SECONDS.lightningBolt,old.SKILL_FX_SECONDS.lightningBolt);
assert(Math.abs(C.SKILLS.M05.damage/112-1.15)<1e-12);assert.equal(C.SKILLS.LM05.damage,94);
const art=readFileSync('shared/engine/src/art.ts','utf8');assert(!art.includes('cheonroeVisualGaps'),'no gap reductions');
mkdirSync('_local/reports/cheonroe-rich-effects',{recursive:true});
writeFileSync('_local/reports/cheonroe-rich-effects/visual-contracts.json',JSON.stringify({original,first,base,status:'passed',rows,geometryCases:9,widthRatio:.7,fxLife:C.SKILL_FX_SECONDS.lightningBolt},null,2)+'\n');
console.log('PASS rich effects: 21 actual command traces vs original + first implementation, 9 exact path cases, 4 trunk/fork layer ratios, unchanged sparks/M04/timing, damage and legacy values');
