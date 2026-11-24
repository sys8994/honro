// Local contract for central cross-stage events only. The stage authors own mechanics.
// App adapter must derive event receipts from observed native callbacks, never user input.
import {battleOwns, party} from './transition-contract.mjs';
const clerk={
 52:{
  'sites-prepared':{effect:'outerSitesPrepared',check:d=>d.cliffSecured===true&&d.bridgeSecured===true&&d.bellSecured===true&&d.partyAssembled===true},
  'soul-split':{effect:'darmheoInTemple',requires:['outerSitesPrepared'],check:d=>d.bodyProtected===true&&d.sodanTetherLive===true&&d.darmheoAtDoor===true}
 },
 56:{
  'first-activation':{effect:'firstActivationComplete',check:d=>d.innerStakeB===true&&d.outerThreeAnchorsReady===true&&d.activateUsed===true},
  'path-reflux':{effect:'firstGarmjinFailed',requires:['firstActivationComplete'],check:d=>d.normalSoulsBlocked===true,objective:'temporary-passage'},
  'escaped-reflux':{effect:'temporaryPassageEscaped',requires:['firstGarmjinFailed'],check:d=>d.temporaryPassageOpen===true&&d.darmheoAtDeepGate===true}
 },
 58:{
  'boss-stopped':{effect:'daedosaStopped',check:d=>d.phaseNumber===3&&d.bossDefeated===true&&d.expansionBroken===true},
  'corrected-inner-stake':{effect:'innerRevisionReady',requires:['daedosaStopped'],check:d=>d.correctedStakePlaced===true}
 },
 59:{
  'retreat-line':{effect:'gwakJinArrived',check:d=>d.reachedRetreatLine===true},
  'repair-point':{effect:'dosikArrived',check:d=>d.revealedRepairPoint===true},
  'completed-garmjin':{effect:'garmjinCompleted',requires:['gwakJinArrived','dosikArrived'],check:d=>d.cliffFixedBy==='archer'&&d.bridgeHeldBy==='knight'&&d.pathMarkedBy==='occultist'&&d.innerRevisionReady===true&&d.normalPathPreserved===true},
  'final-threat-resolved':{effect:'finalThreatResolved',requires:['garmjinCompleted'],check:d=>d.immediateThreatResolved===true}
 },
 60:{
  'return-to-body':{effect:'darmheoSoulReturned',check:d=>d.garmjinCompleted===true&&d.soulAndBodyJoined===true},
  'last-procession-safe':{effect:'lastSoulsGuided',requires:['darmheoSoulReturned'],check:d=>d.attackersHeldOrBypassed===true&&d.soulsAtExit===true},
  'party-at-gate':{effect:'endingStarted',requires:['lastSoulsGuided'],check:d=>d.safelyPresent?.length===4&&party(60).every(k=>d.safelyPresent.includes(k))}
 }
};
export const flag=k=>'act6.'+k;
export const noEarlyTerminal=Object.freeze({56:flag('temporaryPassageEscaped'),59:flag('finalThreatResolved')});
export function observeBoundary(battle,event){
 const id=battle?.honroStage, row=clerk[id]?.[event?.type], saved=battle?.honroAct6;
 if(!battleOwns(id,battle)||!row||!saved||saved.revision!==1||!saved.flags||['won','lost'].includes(battle.phase))return null;
 if(saved.flags[flag(row.effect)]===true||!row.requires?.every(k=>saved.flags[flag(k)]===true)&&row.requires)return null;
 if(!row.check(event.witness??{}))return null;
 // No save, actor or game phase effects here. Event caller atomically stages
 // its real battle action and returns this state with save via existing owner.
 return {...saved,flags:{...saved.flags,[flag(row.effect)]:true},...(row.objective?{objective:row.objective}:{})};
}
