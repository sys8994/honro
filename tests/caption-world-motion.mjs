import assert from 'node:assert/strict';
import {appHarness,plain,report} from './app-regression-helpers.mjs';
import {escortEntryProfile} from './stage23-escort-entry-helper.mjs';
const h=await appHarness(),{g,C}=h,a=h.load(escortEntryProfile(g).profile);a.launch(23);h.finish(a);a.turnNotice=null;
const b=a.engine.b,e=a.engine,S=g.HonroStage23Escort,A=g.HonroAct3,base=g.HonroMapEngine;
// An empty offscreen sweep is a safety fixture, keeping every real actor still.
const ts=[{...base.solid('caption-final',[[3300,500],[3740,500],[3740,640],[3300,640]]),broken:true,indestructible:true},{...base.solid('caption-stored',[[4100,500],[4540,500],[4540,640],[4100,640]]),indestructible:true}];
b.terrain.push(...ts);b.honroWorldTerrain.push(...plain(ts));b.honroEscortYardSpec.cargo={enableTerrainIds:['caption-final'],disableTerrainIds:['caption-stored'],sweepPolygons:[[[3200,380],[4650,380],[4650,650],[3200,650]]],triggerRegion:{minX:0,maxX:99999,y:e.unit('act3-carrier').y,tolerance:40},elementId:'sy-art-cargo',path:[{x:4320,y:570},{x:3520,y:570}]};
A.memory(b).done['dispatch-bundle']=true;A.memory(b).done['carrier-start']=true;S.transition(a);assert.equal(S.memory(b).status,'warned');a.defend();for(let i=0;i<200&&b.phase==='review';i++)e.tick(C.STEP);assert.equal(S.memory(b).status,'sliding');assert(a.dialogue?.staging.manualReader);
let now=10000;g.HonroStory.tick(a,now);assert.equal(S.memory(b).commitCount,0,'reader readiness must not commit physical geometry');
for(let i=0;i<10;i++)g.HonroStory.tick(a,now+=50);assert(S.memory(b).elapsed>0&&S.memory(b).elapsed<1.2);assert.equal(S.memory(b).commitCount,0);
for(let i=0;i<25;i++)g.HonroStory.tick(a,now+=50);assert.equal(S.memory(b).commitCount,1);assert.equal(S.memory(b).status,'settled');assert.equal(a.dialogue.index,0,'visual completion must leave its caption waiting');assert.equal(b.terrain.find(t=>t.id==='caption-final').broken,false);g.HonroStory.next(a);assert.equal(a.dialogue.index,1);g.HonroStory.finish(a);assert.equal(S.memory(b).commitCount,1);
await report('caption-world-motion',['Cargo keeps its existing Story animation clock and commits geometry once while the caption remains manual'],{limits:['Production App/Engine/Story with empty offscreen sweep fixture; not normal Stage23 playthrough.','The existing stage23-escort-runtime test separately fails its fourth warning/review fixture on both d7244a8a and this branch.']});console.log('PASS cargo clock, manual caption, atomic geometry and skip');
