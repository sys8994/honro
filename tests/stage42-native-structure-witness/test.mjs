import assert from 'node:assert/strict';
import {compileStructure} from './structure.mjs';
import {mountStructure} from './author.mjs';
const fixture={background:[[0,2000],[350,1200],[800,1400],[1050,2030]],road:{top:[[0,2000],[3200,2000]],underside:[[0,2280],[1450,2200],[3200,2250]]},deck:{top:[[850,1550],[2200,1530]],underside:[[850,1620],[2200,1600]]},supports:[{head:[[1020,1600],[1100,1600]],toe:[[935,2040],[1130,2040]],sides:[[[1108,1810]],[[970,1870]]]},{head:[[1910,1590],[2010,1590]],toe:[[1870,2030],[2070,2030]],sides:[[[2040,1810]],[[1900,1770]]]}]};
const good=compileStructure(fixture);
assert.deepEqual(good.collision,[]);assert.deepEqual(good.layerOrder.map(x=>x.layer),['back','structural-back','structural-back','structural-back','structural-back']);assert.equal(good.diagnostic.supports.every(s=>s.crossesLowerCorridor&&s.behindLowerActor),true);
let r=structuredClone(fixture);r.deck.underside=[[850,1558],[2200,1538]];assert.throws(()=>compileStructure(r),/Thin line/);
r=structuredClone(fixture);r.supports[0].head=r.supports[0].head.map(([x,y])=>[x,y-80]);assert.throws(()=>compileStructure(r),/unsupported/);
r=structuredClone(fixture);r.supports[1].toe=r.supports[1].toe.map(([x,y])=>[x,y+230]);assert.throws(()=>compileStructure(r),/lacks real/);
r=structuredClone(fixture);r.deck.top=[[850,1880],[2200,1870]];r.deck.underside=[[850,1960],[2200,1950]];assert.throws(()=>compileStructure(r),/actor corridor/);
const fake=()=>{const events=new Map();return {fire:(k,e)=>events.get(k)?.(e),addEventListener:(k,f)=>events.set(k,f),removeEventListener:k=>events.delete(k),getBoundingClientRect:()=>({left:0,top:0,width:400,height:400})}};
const [canvas,nextButton,previewButton,saveButton]=Array.from({length:4},fake);let saved=null,previewed=null,last;const error=[];
mountStructure({canvas,nextButton,previewButton,saveButton,getCamera:()=>({x:200,y:200,zoom:1}),isActive:()=>true,commit:d=>saved=d,preview:d=>previewed=d,onState:s=>last=s,onError:e=>error.push(e)});
canvas.fire('pointerdown',{isTrusted:false,isPrimary:true,button:0,clientX:2,clientY:90});assert.equal(last.clicks,0);
for(const list of [fixture.background,fixture.road.top,fixture.road.underside,fixture.deck.top,fixture.deck.underside,...fixture.supports.flatMap(s=>[s.head,s.sides[0],s.toe,s.sides[1]])]){
 for(const [x,y] of list)canvas.fire('pointerdown',{isTrusted:true,isPrimary:true,button:0,clientX:x,clientY:y});
 await nextButton.fire('click',{isTrusted:true});
}
await previewButton.fire('click',{isTrusted:true});assert.deepEqual(previewed,fixture);assert.equal(saved,null);
await saveButton.fire('click',{isTrusted:true});assert.deepEqual(saved,fixture);assert.equal(error.length,0);
console.log('Structural native contract and simulated event adapter pass, no actual Chrome/art/remote.');
