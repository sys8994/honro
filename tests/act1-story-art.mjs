import assert from 'node:assert/strict';import vm from 'node:vm';import {readFile}from'node:fs/promises';
const g=vm.createContext({});vm.runInContext(await readFile('shared/runtime/story-act1-art.js','utf8'),g);
const A=g.HonroAct1StoryArt,canvas=new Proxy({},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)}),scene={ctx:canvas,time:2,scale:.8};
const base=()=>({honroNarrativeRevision:1,honroState:{},honroMapAnchors:{},honroMarkers:[],terrain:[],units:[]});
for(const stage of [3,4,5,7,8,9,10]){const b=base();b.honroStage=stage;Object.assign(b.honroMapAnchors,{ledger:{x:800,y:400},gate:{x:600,y:500}});b.honroMarkers=[{id:'receiver-5',x:400,y:500},{id:'receiver-west',action:'receiver',x:600,y:500,collected:true},{id:'resident-1',action:'rescue',target:'resident-1',collected:true}];b.terrain=[{id:'cliff-cleat',x:800,y:200,w:84,h:148,honroSeal:true,hp:520,maxHp:520},{id:'sodan-binding',x:715,y:345,w:96,h:126,hp:100,maxHp:200}];b.units=[{id:'p-mage',cls:'mage',side:0,hp:100,x:750,y:550,h:100,facing:1},{id:'npc-sodan',hp:100,x:1000,y:500,h:100},{id:'boss',hp:100,x:1000,y:500,h:100},{id:'resident-1',hp:100,x:600,y:500,h:90}];const before=JSON.stringify(b);assert(A.evidence(b));A.draw(scene,{b});assert.equal(JSON.stringify(b),before,'draw mutated chapter '+stage);}
const b=base();b.honroStage=5;b.terrain=[{id:'cliff-cleat',x:100,y:100,w:84,h:148}];b.honroMarkers=[{id:'receiver-5',x:0,y:300}];assert.equal(A.evidence(b).broken,false);b.terrain[0].broken=true;assert.equal(A.evidence(b).broken,true);b.honroMarkers[0].collected=true;b.honroState.ritual={active:false};assert.equal(A.evidence(b).receiving,true,'completed local receiver still shows the observed consequence');
// Chapter 8 once painted a second, oversized gourd beside Damheo's hand on
// every frame. Story evidence must now draw only the actual bier bindings;
// the shared party rig owns his normal staff and small waist gourd.
const drawOps=b=>{const ops=[],ctx=new Proxy({},{get:(_,key)=>(...args)=>ops.push([key,...args]),set:(_,key,value)=>(ops.push(['set',key,value]),true)});const before=JSON.stringify(b);A.draw({...scene,ctx},{b});assert.equal(JSON.stringify(b),before,'chapter 8 story art preserves the whole battle');return ops;};
let heldPropCases=0;
for(const revision of [undefined,1])for(const facing of [-1,1])for(const phase of ['anchored','first-seal','released','boss-dead']){
 const battle={...base(),honroStage:8,honroStage8BierRevision:revision,
  terrain:[{id:'seal-1',x:600,y:300,w:80,h:120,honroSeal:true,broken:phase!=='anchored'},{id:'seal-2',x:900,y:250,w:80,h:120,honroSeal:true,broken:['released','boss-dead'].includes(phase)}],
  units:[{id:'p-mage',cls:'mage',side:0,hp:100,x:750,y:550,h:100,facing},{id:'boss',hp:phase==='boss-dead'?0:100,dead:phase==='boss-dead',x:1000,y:500,h:100}]};
 const withMage=drawOps(battle),withoutMage=drawOps({...battle,units:battle.units.filter(u=>u.cls!=='mage')});
 assert.deepEqual(withMage,withoutMage,`No extra held prop or receiving particles: ${revision??'legacy'}/${facing}/${phase}`);
 assert.equal(withMage.filter(op=>op[0]==='quadraticCurveTo').length,2,'Both actual bier bindings remain visible');
 const resumed=JSON.parse(JSON.stringify(battle));assert.deepEqual(drawOps(resumed),withMage,'Existing saves render the same prop-free scene');heldPropCases++;
}
console.log(`PASS First-act read-only evidence and cleat consequence; ${heldPropCases} chapter 8 held-prop/save regressions.`);
