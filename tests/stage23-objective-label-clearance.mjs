import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('shared/runtime/objectives.js','utf8');
function render({stage=23,custom=false,buttonPresent=true,hidden=false,visibility='visible',display='block',rect={left:738,right:832,top:118,bottom:161,width:94,height:43},offset=0,dpr=1}={}){
 const rectAt=r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,['left','right','top','bottom'].includes(k)?v+offset:v]));
 const button={hidden,getBoundingClientRect:()=>rectAt(rect)},mini=rectAt({left:680,right:830,top:10,bottom:105,width:150,height:95}),labels=[],arrows=[];
 const ctx=new Proxy({measureText:()=>({width:252}),fillRect:(x,y,w,h)=>labels.push({left:x,right:x+w,top:y,bottom:y+h}),fill:()=>arrows.push(1)},{get:(o,k)=>o[k]||(()=>{})});
 const g={document:{querySelector:()=>({getBoundingClientRect:()=>({top:278+offset})}),getElementById:id=>id==='minimap'?{getBoundingClientRect:()=>mini}:id==='equipment-pending-battle'&&buttonPresent?button:null},getComputedStyle:()=>({visibility,display}),HonroAct2:{active:()=>false}};
 vm.runInNewContext(source,g);const scene={ctx,size:()=>({w:844,h:390,d:dpr}),scale:1,x:0,y:0,canvas:{getBoundingClientRect:()=>({top:offset,left:offset})},missionTargets:[{id:'dock-exit',x:1000,y:-50,label:'호송하기'}]},e={b:{honroStage:stage,honroCustom:custom}};
 const before=JSON.stringify({b:e.b,targets:scene.missionTargets});g.HonroObjectives.draw(scene,e);assert.equal(JSON.stringify({b:e.b,targets:scene.missionTargets}),before);return{labels,arrows,reported:scene.missionDrawn};
}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const button={left:738,right:832,top:118,bottom:161};
const fixed=render();assert.equal(fixed.labels.length,1);assert(!overlap(fixed.labels[0],button));assert.equal(fixed.labels[0].top,169);assert.equal(fixed.reported.length,1);
const legacy=render({stage:22});assert(overlap(legacy.labels[0],button),'The original position is the reproducer');
for(const options of [{stage:24},{custom:true},{buttonPresent:false},{hidden:true},{visibility:'hidden'},{display:'none'},{rect:{...button,width:0,height:0}}])assert.deepEqual(render(options).labels,legacy.labels,'Unaffected stage/custom/hidden button '+JSON.stringify(options));
assert.deepEqual(render({offset:31,dpr:2}).labels,fixed.labels,'DOM/CSS coordinates, not DPR-scaled coordinates');
const low={left:738,right:832,top:105,bottom:260,width:94,height:155};assert(!overlap(render({rect:low}).labels[0],low),'Use real clamped left placement if below is outside HUD clearance');
const full={left:0,right:844,top:0,bottom:278,width:844,height:278},noRoom=render({rect:full});assert.equal(noRoom.labels.length,0,'Do not draw a clamped overlapping secondary label when no space exists');assert.equal(noRoom.arrows.length,1,'The actual target direction arrow remains');
console.log('PASS Stage23-only equipment label clearance: current landscape reproduction, unchanged adjacent/custom maps, hidden/zero DOM, CSS offsets/DPR, left fallback and no-space arrow');
