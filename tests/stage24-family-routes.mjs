import assert from 'node:assert/strict';import fs from 'node:fs';import {runtime,battlefield} from '../game/tests/helpers.mjs';import {followVerticalRoute} from './vertical-route-helpers.mjs';import {PROFILE,ground,authorFamily24} from '../tools/map-forge/stage24-family-compound.mjs';
const g=await runtime({legacyMaps:false}),results=[];
for(const cls of ['archer','mage','knight','occultist']){
 const q=battlefield(g,24),u=q.b.units.find(u=>u.side===0&&u.cls===cls);q.b.units=[u];q.b.queue=[u.id];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;
 Object.assign(u,{x:240,y:2700,vx:0,vy:0,airborne:false,jumping:false});const gate=g.HonroQuestTargets.records(q.b).find(t=>t.id==='shrine-door');gate.broken=true;
 const points=[[240,2700],...PROFILE.slice(1,-1),[6810,2440]];const route={anchors:[...points,...points.slice(0,-1).reverse()].map(([x,y])=>({x,y}))};
 const r=followVerticalRoute(g,q,u,route);results.push({cls,...r});console.log(cls,r.passed,r.failed);assert(r.passed,JSON.stringify(r.failed));
}
for(const cls of ['archer','mage','knight','occultist']){
 const q=battlefield(g,24),u=q.b.units.find(u=>u.side===0&&u.cls===cls);q.b.units=[u];q.b.queue=[u.id];q.b.active=u.id;q.b.side=0;q.b.phase='aim';q.e.checkEnd=()=>false;Object.assign(u,{x:2820,y:ground(2820),vx:0,vy:0,airborne:false,jumping:false});
 const r=followVerticalRoute(g,q,u,{anchors:[{x:2820,y:ground(2820),jumpTo:{x:2890,y:2440+30*70/260,support:'family24-garden-gallery'}},{x:3120,y:2510},{x:3960,y:2510},{x:4190,y:2537.6,dropTo:{x:4300,y:ground(4300),stepOffX:4230,support:'a3-foundation'}},{x:4300,y:ground(4300),jumpTo:{x:4190,y:2537.6,support:'family24-garden-gallery'}},{x:3960,y:2510},{x:3120,y:2510},{x:2890,y:2440+30*70/260,dropTo:{x:2820,y:ground(2820),stepOffX:2820,support:'a3-foundation'}}]});results.push({cls,route:'garden-gallery',...r});console.log('gallery',cls,r.passed,r.failed);assert(r.passed,JSON.stringify(r.failed));
}
fs.writeFileSync('review/stage24/routes.json',JSON.stringify({passed:true,scope:'Four bodies finite move/wait round trip; single setup pose, enemies removed and gate opened to isolate terrain. No later position/resource writes. Not normal combat.',results},null,2));
