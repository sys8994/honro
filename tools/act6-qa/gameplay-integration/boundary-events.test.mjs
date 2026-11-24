import test from 'node:test';
import assert from 'node:assert/strict';
import {observeBoundary,flag} from './boundary-events.mjs';
const battle=id=>({stage:id,honroStage:id,honroAuthoredId:'stage-'+id,mode:'campaign',honroMapOrigin:'campaign',honroCanonical:true,honroCustom:false,honroAct6Revision:1,phase:'aim',honroAct6:{revision:1,flags:{}}});
const step=(b,type,witness)=>{
 const before=JSON.stringify(b), next=observeBoundary(b,{type,witness});
 assert.equal(JSON.stringify(b),before);
 if(!next)return null;
 return {...b,honroAct6:next};
};
test('split requires anchors, tether and body, and is one-shot after a cold serialization',()=>{
 let b=battle(52);const tether={bodyProtected:true,sodanTetherLive:true,darmheoAtDoor:true};
 assert.equal(step(b,'soul-split',tether),null);
 b=step(b,'sites-prepared',{cliffSecured:true,bridgeSecured:true,bellSecured:true,partyAssembled:true});
 assert.equal(step(b,'soul-split',{...tether,bodyProtected:false}),null);
 b=step(b,'soul-split',tether);assert(b.honroAct6.flags[flag('darmheoInTemple')]);
 assert.equal(step(JSON.parse(JSON.stringify(b)),'soul-split',tether),null);
});
test('first garmjin failure changes objective without ending battle or opening terminal',()=>{
 let b=battle(56);
 assert.equal(step(b,'path-reflux',{normalSoulsBlocked:true}),null);
 b=step(b,'first-activation',{innerStakeB:true,outerThreeAnchorsReady:true,activateUsed:true});
 b=step(b,'path-reflux',{normalSoulsBlocked:true});
 assert.equal(b.honroAct6.objective,'temporary-passage');assert.equal(b.phase,'aim');
 assert.equal(b.honroAct6.flags[flag('temporaryPassageEscaped')],undefined);
 assert.equal(step(b,'escaped-reflux',{temporaryPassageOpen:true}),null);
 b=step(b,'escaped-reflux',{temporaryPassageOpen:true,darmheoAtDeepGate:true});
 assert(b.honroAct6.flags[flag('temporaryPassageEscaped')]);
});
test('boss HP is insufficient; 59 external victories need actual roles and final clean-up',()=>{
 const boss=battle(58);
 assert.equal(step(boss,'boss-stopped',{phaseNumber:3,bossDefeated:true}),null);
 assert(step(boss,'boss-stopped',{phaseNumber:3,bossDefeated:true,expansionBroken:true}));
 let b=battle(59);
 const actual={cliffFixedBy:'archer',bridgeHeldBy:'knight',pathMarkedBy:'occultist',innerRevisionReady:true,normalPathPreserved:true};
 assert.equal(step(b,'completed-garmjin',actual),null);
 b=step(b,'retreat-line',{reachedRetreatLine:true});
 b=step(b,'repair-point',{revealedRepairPoint:true});
 assert.equal(step(b,'completed-garmjin',{...actual,pathMarkedBy:'mage'}),null);
 b=step(b,'completed-garmjin',actual);
 assert(!b.honroAct6.flags[flag('finalThreatResolved')]);assert.equal(b.phase,'aim');
 assert(step(b,'final-threat-resolved',{immediateThreatResolved:true}));
});
test('all four actual bodies at end; absent mage and cross-stage/Workshop spoof reject',()=>{
 let b=battle(60);const sameid={garmjinCompleted:true,soulAndBodyJoined:true};
 assert.equal(step({...b,honroMapOrigin:'workshop'},'return-to-body',sameid),null);
 assert.equal(step(battle(51),'return-to-body',sameid),null);
 b=step(b,'return-to-body',sameid);b=step(b,'last-procession-safe',{attackersHeldOrBypassed:true,soulsAtExit:true});
 assert.equal(step(b,'party-at-gate',{safelyPresent:['archer','knight','occultist']}),null);
 const proof={safelyPresent:['archer','knight','occultist','mage']};
 assert(step(b,'party-at-gate',proof).honroAct6.flags[flag('endingStarted')]);
});
