/** Actual rank-one Stage8 role shots on the authored roster. Each comparison
 * declares its initial supported player pose; paid movement thereafter is live.
 * No normal arrival/fullplay claim, target HP edits or substitute enemies. */
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {bierRoleHarness} from './stage8-bier-live-roles-helper.mjs';
const H=await bierRoleHarness(),rows=[],out='_local/reports/stage8-bier',only=process.argv.find(x=>x.startsWith('--case='))?.slice(7);
const shot=(cls,support,x,skill,angle,power,options)=>H.fire(H.fixture(cls,support,x),skill,angle,power,options);
const settle=q=>{for(let n=0;n<300&&!q.e.grounded(q.u);n++)H.tick(q);assert(q.e.grounded(q.u));assert(H.C.validTerrainContactPose(q.b.terrain,q.u));};
const save=async(extra={})=>{await mkdir(out,{recursive:true});await writeFile(out+'/live-roles'+(only?'-'+only:'')+'.json',JSON.stringify({...(await H.provenance()),status:only?'selected-role-fixture':'role-fixtures',initialRoster:H.stage.units.filter(u=>u.team==='enemy').map(u=>({id:u.id,kind:u.kind,x:u.x,y:u.y})),rows,...extra},null,2)+'\n');};
async function check(id,title,fn){if(only&&only!==id)return;try{const result=await fn();rows.push({id,title,...result});console.log('PASS',id,title);await save();}catch(error){await save({status:'failed',failedCase:id,error:String(error)});throw error;}}
if(process.argv.includes('--prepare')){
 const spawn=H.stage.units.find(u=>u.team==='player'&&u.kind==='archer'),support=spawn.surfaceId||H.stage.anchors.start.support,q=H.fixture('archer',support,spawn.x),before=q.e.alive(1).length;
 const s=H.fire(q,'A01',45,.35);assert.equal(before,29);assert.equal(s.focusSpent,0);assert.equal(s.rank,1);assert(q.e.heroesAlive().every(u=>u.level===7));rows.push({case:'guarded-actual-free-arrow-harness',shot:s,roleAcceptance:false});
 await mkdir(out,{recursive:true});await writeFile(out+'/live-roles-harness.json',JSON.stringify({status:'harness-only',...(await H.provenance()),rows},null,2)+'\n');console.log('PASS guarded legal-entry actual-fire harness.');
}else{
 await check('A11','paid high-shoulder access and actual descending damage; reaimed basic remains possible',()=>{
  const q=H.fixture('archer','s8-branch',5200),start=q.u.moveLeft,approach=[H.walk(q,5260)];assert(approach[0].arrived);approach.push(H.jump(q),H.walk(q,5450,{speed:.55}));assert(approach[2].arrived);settle(q);approach.push(H.walk(q,5680));assert(approach[3].arrived);assert.equal(q.e.contactSurface(q.u.x,q.u.y-.2,q.u.y+.2)?.t.id,'s8-east-shoulder');const approachCost=start-q.u.moveLeft;assert(approachCost>600&&approachCost<650);
  const paid=H.fire(q,'A11',20,1),same=shot('archer','s8-east-shoulder',paid.from.x,'A01',20,1),basic=shot('archer','s8-east-shoulder',paid.from.x,'A01',19,.75),hit=paid.hits.find(h=>h.id==='s8-23');
  assert(paid.damage['s8-23']>0&&hit?.apex);assert(hit.y-hit.apexY>400);assert.equal(paid.focusSpent,32);assert(!same.damage['s8-23']);assert(basic.damage['s8-23']>0);assert.equal(basic.focusSpent,0);assert.equal(paid.targetBefore['s8-23'].hp,q.initialEnemyHp['s8-23']);
  return{paid,sameAngleBasic:same,reaimedBasic:basic,approach,approachCost,actualDrop:hit.y-hit.apexY,inputs:q.inputs,tradeoff:'D itself is not the demonstrated firing position. Ordinary walking plus jump75 spends about621 movement to reach the exposed shoulder. A11 buys a steeper descending hit for32MP; free A01 can hit the same ground elite by reaiming.'};
 });
 await check('M04','actual three-body hollow receives three radius260 follow-ups',()=>{
  const paid=shot('mage','s8-west-walk',3900,'M04',24,.35),basic=shot('mage','s8-west-walk',3900,'M01',24,.35),ids=['s8-10','s8-11','s8-12'],distances=paid.lightning.map(p=>Math.hypot(p.x2-p.x,p.y2-p.y));
  assert(ids.every(id=>paid.damage[id]>0));assert.equal(paid.lightning.length,3);assert(distances.every(d=>d<=260));assert(distances.some(d=>d>82));assert.equal(paid.focusSpent,38);assert.equal(basic.focusSpent,0);assert(basic.damage['s8-11']>0);assert(!basic.damage['s8-10']&&!basic.damage['s8-12']);
  return{paid,basic,secondaryRadius:260,secondaryDistances:distances,tradeoff:'38MP spreads actual damage across the existing three-body cluster. The free same-approach pulse damages its central body only; this is not a three-kill claim.'};
 });
 await check('M11','real solid-side reflection damages the crow; free direct reaim remains viable',()=>{
  const paid=shot('mage','s8-west-walk',3810,'M11',166,.55),same=shot('mage','s8-west-walk',3810,'M01',166,.55),basic=shot('mage','s8-west-walk',3810,'M01',112,.55),solid=paid.contacts.find(h=>h.id==='s8-store-reflector');
  assert(solid&&solid.mat==='rock'&&!solid.oneWay);assert(paid.hits.some(h=>h.id==='s8-9'&&h.bounces===2));assert(paid.damage['s8-9']>0);assert.equal(paid.focusSpent,34);assert(!same.damage['s8-9']);assert(basic.damage['s8-9']>0);assert.equal(basic.focusSpent,0);
  return{paid,sameAngleBasic:same,reaimedBasic:basic,tradeoff:'The paid wave first meets the real bridge top, then the solid stone side, then the crow. This is not a reflection off a oneWay underside. A free reaim from exactly the same supported position remains possible.'};
 });
 await check('S01','optional leap engagement and real next-turn retreat versus paid basic approach',()=>{
  const q=H.fixture('knight','s8-ground',5830),paid=H.fire(q,'S01',25,.75),same=shot('knight','s8-ground',5830,'S00',0,1);assert(paid.damage['s8-19']>0);assert.equal(paid.focusSpent,24);assert(!same.damage['s8-19']);assert.equal(same.focusSpent,8);settle(q);
  const next=H.nextTurn(q),retreat=H.walk(q,5830);assert(next.endRound>next.start.round);assert(retreat.arrived&&retreat.moveSpent>0&&q.u.hp>0);const b=H.fixture('knight','s8-ground',5830),approach=H.walk(b,6010);assert(approach.arrived);const basic=H.fire(b,'S00',0,1);assert(basic.damage['s8-19']>0);assert.equal(basic.focusSpent,8);
  return{paid,samePositionBasic:same,normalNextTurn:next,retreat,paidInputs:q.inputs,basicApproach:approach,basic,basicInputs:b.inputs,tradeoff:'S01 closes distance within the attack for24MP. The ordinary walk plus S00 costs movement and8MP, and can deal at least as much damage. Retreat waits through actual enemy actions and spends the next ordinary movement pool.'};
 });
 await check('S04','actual manual dive engages the ground pair and returns on the next ordinary turn',()=>{
  const q=H.fixture('knight','s8-ground',5830),paid=H.fire(q,'S04',35,.75,{diveFrame:110}),same=shot('knight','s8-ground',5830,'S00',0,1);assert(paid.dive);assert(paid.damage['s8-19']>0&&paid.damage['s8-20']>0);assert.equal(paid.focusSpent,34);assert(!same.damage['s8-19']&&!same.damage['s8-20']);assert.equal(same.focusSpent,8);settle(q);
  const next=H.nextTurn(q),retreat=H.walk(q,5830);assert(next.endRound>next.start.round);assert(retreat.arrived&&retreat.moveSpent>0&&q.u.hp>0);const b=H.fixture('knight','s8-ground',5830),approach=H.walk(b,6120);assert(approach.arrived);const basic=H.fire(b,'S00',0,1);assert(basic.damage['s8-19']>0&&basic.damage['s8-20']>0);assert.equal(basic.focusSpent,8);
  return{paid,samePositionBasic:same,normalNextTurn:next,retreat,paidInputs:q.inputs,basicApproach:approach,basic,basicInputs:b.inputs,tradeoff:'34MP gives an optional aerial arrival and manually timed area impact, not a required route. Walking into range plus8MP S00 also damages the pair. The knight remains at the impact position and pays actual next-turn retreat movement after enemy pressure.'};
 });
 await check('A02','actual thin-wood penetration and an ordinary jump-around free-arrow alternative',()=>{
  const q=H.fixture('archer','s8-west-shoulder',3310),wood=q.b.terrain.find(t=>t.id==='s8-store-screen');assert(wood&&wood.mat==='wood'&&wood.w<=90);const paid=H.fire(q,'A02',56,.65),same=shot('archer','s8-west-shoulder',3310,'A01',56,.65);assert(paid.contacts.some(h=>h.id===wood.id&&h.mat==='wood'&&!h.oneWay));assert(paid.hits.some(h=>h.id==='s8-15'&&h.pierces===1));assert(paid.damage['s8-15']>0);assert.equal(paid.focusSpent,36);assert(!same.damage['s8-15']);assert(same.contacts.some(h=>h.id===wood.id));assert.equal(same.focusSpent,0);
  const b=H.fixture('archer','s8-west-shoulder',3310),start=b.u.moveLeft,approach=[H.walk(b,3350)];assert(approach[0].arrived);approach.push(H.jump(b),H.walk(b,3530,{speed:.55}));assert(approach[2].arrived);settle(b);assert.equal(b.e.contactSurface(b.u.x,b.u.y-.2,b.u.y+.2)?.t.id,'s8-west-shoulder');const approachCost=start-b.u.moveLeft,basic=H.fire(b,'A01',75,.35);assert(approachCost>300&&approachCost<350);assert(basic.damage['s8-15']>0);assert.equal(basic.focusSpent,0);
  const rock=shot('archer','s8-branch-rise',2890,'A02',20,.35);assert(rock.contacts.some(h=>h.id==='s8-west-root'&&h.mat==='rock'));assert(!rock.damage['s8-15']);
  return{paid,sameAngleBasic:same,basicApproach:approach,approachCost,basic,basicInputs:b.inputs,rockStop:rock,woodWidth:wood.w,tradeoff:'A02 spends36MP to pierce the actual68-wide wood screen without moving. Ordinary walking plus jump75 costs about327 movement and permits a free A01 hit beyond it. The same paid skill still stops at the actual underlying rock from the lower eave.'};
 });
 assert(rows.length===(only?1:6));await save({status:only?'selected-role-passed':'all-six-role-fixtures-passed'});
}
