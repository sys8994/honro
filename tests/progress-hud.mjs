import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime,battlefield} from '../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),checks=[];
function test(name,fn){try{const detail=fn();checks.push({name,pass:true,detail});console.log('PASS',name,detail||'');}catch(e){checks.push({name,pass:false,error:String(e)});console.error('FAIL',name,e);}}
test('Stage 1 uses its reachable map exit instead of the obsolete content width',()=>{
 const {b,e,st}=battlefield(g,1),u=e.active,exit=b.honroMarkers.find(m=>m.type==='exit'),at=x=>{u.x=x;return g.HonroObjectives.state(b,st);};
 b.round=3;assert.equal(b.width,4200);assert.equal(exit.x,4050);assert(st.w-300>b.width,'Regression fixture must retain the stale content dimensions');
 assert(!at(exit.x-121).complete);assert(at(exit.x-120).complete);const result=at(exit.x);assert(result.complete);assert.equal(result.allTargets.find(t=>t.kind==='exit').x,exit.x);assert(u.x<b.width);
 return{mapWidth:b.width,legacyWidth:st.w,exit:exit.x,requiredBefore:st.w-300};
});
test('An older saved map keeps its own exit, progress and actors',()=>{
 const {b,e,st}=battlefield(g,1),u=e.active,marker=b.honroMarkers.find(m=>m.type==='exit');b.round=3;b.width=8200;marker.x=8020;b.honroState.flags.saved=true;u.x=marker.x-121;
 assert(!g.HonroObjectives.state(b,st).complete);u.x=marker.x-120;const before=JSON.stringify(b);const saved=JSON.parse(before);assert(g.HonroObjectives.state(saved,st).complete);assert.equal(JSON.stringify(saved),before);
});
test('Exit fallback uses saved anchors and then the live width',()=>{
 const {b,e,st}=battlefield(g,1);b.round=3;b.honroMarkers=b.honroMarkers.filter(m=>m.type!=='exit');b.honroMapAnchors.exit.x=3800;e.active.x=3680;assert(g.HonroObjectives.state(b,st).complete);
 delete b.honroMapAnchors.exit;e.active.x=b.width-301;assert(!g.HonroObjectives.state(b,st).complete);e.active.x=b.width-300;assert(g.HonroObjectives.state(b,st).complete);
});
test('Escort and rescue still require their mission conditions at the displayed destination',()=>{
 const {b,e,st}=battlefield(g,2),car=e.unit('objective');car.x=b.honroEscortGoalX;assert(!g.HonroObjectives.state(b,st).complete);
 b.round=4;for(const u of e.alive(1)){u.hp=0;u.dead=true;}for(const ev of b.honroEvents)b.honroState.flags['event:'+ev.id]=true;
 assert(g.HonroObjectives.state(b,st).complete);assert.equal(g.HonroObjectives.state(b,st).allTargets.find(t=>t.kind==='exit').x,car.x);
 const r=battlefield(g,6),marker=r.b.honroMarkers.find(m=>m.type==='exit'),convoy=r.e.unit('objective');convoy.x=marker.x;r.b.honroState.rescued=true;r.b.honroState.objectiveReadyRound=11;r.b.round=12;
 assert(!g.HonroObjectives.state(r.b,r.st).complete);for(const u of r.b.units.filter(u=>u.honroMidboss)){u.dead=true;u.hp=0;}
 assert(g.HonroObjectives.state(r.b,{...r.st,w:r.st.w+9000}).complete);r.b.honroState.rescued=false;assert(!g.HonroObjectives.state(r.b,r.st).complete);
});
await mkdir('_local/reports/progress-hud',{recursive:true});await writeFile('_local/reports/progress-hud/unit.json',JSON.stringify({checks},null,2)+'\n');if(checks.some(c=>!c.pass))process.exitCode=1;
