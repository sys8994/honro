import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBrokenRail,validBrokenRailCrossing} from '../../../../../shared/act6-mumyeongsa/broken-rail.mjs';
import {composeTornEave,tornEave,validTornEave} from '../../../../../shared/act6-mumyeongsa/torn-eave.mjs';
import {hallSill} from '../../../../../shared/act6-mumyeongsa/hall-b.mjs';
import {returnGate,verifyReturnGate} from '../../../../../shared/act6-mumyeongsa/return-gate.mjs';

const read=relative=>JSON.parse(readFileSync(new URL(relative,import.meta.url),'utf8'));
const compare=(sent,received,offset=[0,0])=>{
 const delta=[received.x-sent.x-offset[0],received.y-sent.y-offset[1]];
 assert.ok(Math.hypot(...delta)<=4,JSON.stringify({sent,received,delta}));
 return delta;
};
const cases=(validate,proof,changes)=>{
 assert.ok(validate(proof));
 return Object.fromEntries(Object.entries(changes).map(([name,change])=>{
  const modified=structuredClone(proof);change(modified);
  const rejected=!validate(modified);assert.ok(rejected,name);return [name,rejected];
 }));
};
const actor='p-mage';
const broken=createBrokenRail(read('../../../../../shared/act6-b-slice/layout.json'));
const liveB=read('../native-b/observed.json');
const b={authoredWidth:broken.clearWidth,physicalWidth:broken.wall.left-broken.jamb.right,cases:{}};
assert.equal(b.authoredWidth,b.physicalWidth);
for(const rate of ['60','120']){
 const row=liveB[rate],proof=row.bridge,arrival=row.live54.actors.find(u=>u.id===actor);
 assert.equal(row.status,'PASS');
 assert.equal(row.matchedDummyMasks,true);
 b.cases[rate]={source:proof.from,threshold:proof.to,arrival,
  step:Math.abs(proof.from.y-proof.to.y),handoffDelta:compare(proof.to,arrival),
  rejects:cases(p=>validBrokenRailCrossing(broken,actor,p),proof,{
   wide:p=>{p.clearWidth++},wrongSide:p=>{p.to.y=broken.crossY+1},
   longStep:p=>{p.from.y=p.to.y+10.01},airborne:p=>{p.to.grounded=false},wrongFace:p=>{p.to.x--}
  })};
 assert.ok(b.cases[rate].step<=4);
}

const cSource=read('../mobile-seams/c-send-native.json').to55.terminal.eave;
const cCold=read('../mobile-seams/contacts-360.json').find(row=>row.stage===56).movement.ceiling;
const cSave=read('../mobile-seams/captured-c-source.json').checkpoint56.custody.eave;
const cShape=composeTornEave({}).map.terrains;
const c={authoredWidth:tornEave.clearWidth,
 physicalWidth:Math.min(...cShape[1].points.map(v=>v.y))-Math.max(...cShape[0].points.map(v=>v.y)),
 approach:cSource.approach,threshold:cSource.exit,arrival:cCold,relayedSave:cSave.exit,
 handoffDelta:compare(cSource.exit,cCold),saveDelta:compare(cSource.exit,cSave.exit),
 rejects:cases(p=>validTornEave(actor,p),cSource,{
  early:p=>{p.approach.x=tornEave.seam-10.01},late:p=>{p.approach.x=tornEave.seam},
  normal:p=>{p.exit.normal.y=-1},gravity:p=>{p.gravity.y=320},wrongWidth:p=>{p.clearWidth++}
 })};
assert.equal(c.authoredWidth,c.physicalWidth);

const pcD=read('../d-interior/pc.json');
const dReceipt=pcD.checkpoint57.custody.interiorD;
const dSeam=read('../../../../../shared/data/act6-qa/seventh.json').bridge.additions.terrain.find(t=>t.id===hallSill.source);
const dOffset=[6536-(dSeam.vertices[0].x-hallSill.offset.x),3232-(dSeam.vertices[0].y-hallSill.offset.y)];
const mobileD=read('../mobile-seams/d-send-native.json');
const d={authoredWidth:hallSill.clearWidth,innerWidth:dReceipt.clearWidth,
 commonSupportSpan:hallSill.to-hallSill.from,offset:dOffset,internalReceipt:dReceipt,
 canonicalDelta:compare(dReceipt.contact,{x:dReceipt.contact.junctionX,y:dReceipt.contact.junctionY},dOffset.map(v=>-v)),
 rejects:{...pcD.wrong57,receiverJunction:pcD.wrong58.junction},external:{}};
assert.equal(d.authoredWidth,d.innerWidth);
assert.ok(Object.values(d.rejects).every(Boolean));
assert.deepEqual(pcD.exterior.checkpoint58.custody.interiorD,dReceipt);
assert.ok(pcD.exterior.sameObjects&&mobileD.sameObjects);
for(const [form,row] of [['pc',pcD.exterior],['touch',mobileD]]){
 d.external[form]=row.outgoing.actors.filter(u=>u.side===0).map(u=>{
  const live=row.live.actors.find(x=>x.id===u.id),cold=row.newCold.actors.find(x=>x.id===u.id);
  assert.ok(u.grounded&&live.grounded&&cold.grounded);
  return {id:u.id,sent:[u.x,u.y],arrived:[live.x,live.y],
   handoffDelta:compare(u,live,[-hallSill.offset.x,-hallSill.offset.y]),coldDelta:compare(live,cold)};
 });
 assert.equal(d.external[form].length,4);
}

const roundR=read('../encounters/hall-pressure/phase-counterplay-touch-r58.json');
const rProof=roundR.routeReceipt, rCrew=Object.fromEntries(roundR.outgoing.actors.map(u=>[u.cls,u]));
assert.ok(roundR.liveSameObjects);
assert.deepEqual(roundR.outgoing.landmark,roundR.live.landmark);
const r={supportSpan:returnGate.right-returnGate.left,threshold:returnGate.sill,
 crew:rProof.actors.map(u=>({id:u.id,enter:u.enter,step:u.step,exit:u.exit,
  handoffDelta:compare(u.exit,roundR.live.actors.find(a=>a.id===u.id)),
  coldDelta:compare(u.exit,roundR.cold.actors.find(a=>a.id===u.id))})),
 rejects:cases(p=>verifyReturnGate(p,rCrew),rProof,{
  missingActor:p=>{p.actors.pop()},wrongSill:p=>{p.sill++},
  noCross:p=>{p.actors[0].enter=p.actors[0].step},offSurface:p=>{p.actors[0].step.y++},
  wrongGravity:p=>{p.gravity.y=-320}
 })};
console.log(JSON.stringify({B:b,C:c,D:d,R:r},null,2));
