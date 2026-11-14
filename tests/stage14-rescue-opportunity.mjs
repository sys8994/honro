// Focused production App/Engine fixtures, not normal-play evidence.
import assert from 'node:assert/strict';
import {appHarness} from './app-regression-helpers.mjs';
const h=await appHarness({productionStory:true}),g=h.g,V=g.HonroAct23V4,S=g.HonroAct23V4Act2Scenes,P=g.HonroAct23V4ReviewedChapters;
const app=h.load(h.profileThrough(13));app.launch(14);app.dialogue=null;app.turnNotice=null;
const e=app.engine,b=e.b,u=e.unit('14.gilchan'),sodan=V.heroes(b).find(u=>u.cls==='occultist'),mage=V.heroes(b).find(u=>u.cls==='mage');
assert(P.active(b));
const a=S.memory(b),q=P.memory(b),base=S.base.memory(b),spec=b.honroV4Hypnosis;
for(const s of V.steps(b)){if(s.id==='14.extract')break;V.mem(b).done[s.id]=true;}
for(const k of ['arrival','voice','news','approach','invite','door','hypnosis','warning'])q.events[k]={status:'done'};
base.houseOpen=true;a.hypnosis={struck:true};a.proof['14.bell']={distance:100};a.walks['14.hypnosis']={arrived:true,distance:100,start:{x:u.x-100,y:u.y}};
u.x=spec.warningPoint.x;u.y=spec.warningPoint.y;u.fixed=true;a.hypnosisWarning={offered:{},opportunityRevision:2};
mage.x=0;mage.y=0;Object.assign(sodan,{x:u.x-85,y:u.y,acted:false});Object.assign(b,{active:sodan.id,side:0,phase:'aim'});
const api=P.apiFor(14),row=api.row('A2.S14.MID.08');assert(P.lineAllowed(app,row.speaker,{rowId:row.id,reviewedStage:14,reviewedRevision:1}),'Sodan approach unlocks existing separation dialogue without mage proximity');
assert(!V.eligibility(app,V.marker(b,'14.extract')).ok,'unplayed guidance still blocks extraction');
S.tick(app,.025);e.finishAction(true);assert(!a.hypnosisWarning.response,'disabled interaction cannot spend rescue opportunity');
q.events.separate={status:'done'};
function ready(distance){app.dialogue=null;app.turnNotice=null;Object.assign(b,{active:sodan.id,side:0,phase:'aim'});Object.assign(sodan,{x:u.x-distance,y:u.y,acted:false});}
ready(240);assert(!V.eligibility(app,V.marker(b,'14.extract')).ok,'UI agrees with final use range');
ready(400);S.tick(app,.025);e.finishAction(true);assert(!a.hypnosisWarning.response,'outside interaction range cannot spend opportunity');
ready(85);assert(V.eligibility(app,V.marker(b,'14.extract')).ok);S.tick(app,.025);e.finishAction(true);assert(a.hypnosisWarning.response,'usable rescue declined by ending action retains intended danger');
const before={x:u.x,y:u.y};a.hypnosisWarning.opportunityRevision=undefined;a.dangerCrossed=true;S.prepare(b,app.profile);assert(!a.hypnosisWarning.response&&!a.dangerCrossed);assert.deepEqual({x:u.x,y:u.y},before,'legacy in-progress snapshot positions preserved');
ready(85);assert(V.use(app,V.marker(b,'14.extract')),'Sodan can extract');assert(base.proof['14.extract']);assert(u.honroResolved&&!u.honroHypnotized);assert(!a.hypnosisWarning.response,'successful rescue does not arm danger');
// Actual loss display must not leak its internal reason key.
app.dialogue=null;app.turnNotice=null;Object.assign(b,{side:0,phase:'aim'});a.dangerCrossed=true;assert(app.checkMission(e));assert.equal(b.phase,'lost');assert(b.winnerReason.includes('위험 경계'));assert(!b.winnerReason.includes('act23v4'));
console.log('PASS stage14: Sodan-only approach, disabled/far action safety, real opportunity, legacy-save preservation, successful extraction, readable failure');
