// Scratch integration specification only. Never bundled or called by the production app.
import assert from 'node:assert/strict';

const FLAGS=[
 ['threeSitesSighted'],
 ['outerSitesPrepared','darmheoInTemple'],
 ['innerStakeAReady'],
 ['invertedGalleryCrossed'],
 ['outerThreeAnchorsReady'],
 ['firstGarmjinFailed'],
 ['fallbackRelaySecured'],
 ['daedosaStopped','innerRevisionReady'],
 ['gwakJinArrived','dosikArrived','garmjinCompleted'],
 ['darmheoSoulReturned','endingStarted'],
];
const PARTY={all:['archer','mage','knight','occultist'],inner:['mage'],outer:['archer','knight','occultist']};
const INSIDE=new Set([53,54,56,58]), EXTERNAL=new Set([55,57,59]);
const has=(o,k)=>Object.prototype.hasOwnProperty.call(o??{},k), cleared=(p,id)=>!!p?.cleared?.[id];
const flag=f=>'act6.'+f;
export const IDS=Object.freeze(Array.from({length:10},(_,i)=>i+51));
export const TYPES=Object.freeze(Object.fromEntries(IDS.map(id=>[id,INSIDE.has(id)?'inner':EXTERNAL.has(id)?'outer':'all'])));
export const party=id=>PARTY[TYPES[id]]?.slice()??null;
export const terminalFlags=id=>(FLAGS[id-51]??[]).map(flag);

// 'enabled' is a trusted producer decision, not a user-supplied field. The
// joint signed content/registry/map/packet/journey/balance check occurs upstream.
export function admitsProofPack(enabled, chapters) {
 return enabled===true&&Array.isArray(chapters)&&chapters.length===10&&
  chapters.every((x,i)=>x?.id===IDS[i]&&x.act===6&&x.actStage===i+1&&x.stageId===IDS[i]&&
    x.authoredId==='stage-'+IDS[i]&&x.requires?.length===1&&x.requires[0]===IDS[i]-1&&
    Array.isArray(x.playerRecords)&&x.playerRecords.length===party(x.id).length&&
    new Set(x.playerRecords.map(u=>u.id)).size===x.playerRecords.length&&
    x.playerRecords.every((u,j)=>typeof u.id==='string'&&!!u.id&&u.team==='player'&&u.kind===party(x.id)[j]));
}

export function canEnter(profile,id,packAuthorized) {
 if(packAuthorized!==true||!IDS.includes(id)||!cleared(profile,50))return false;
 // Legitimate old pre-Act6 profile: use actual predecessor clear, not new
 // defaulted act5.* booleans. Native test needed before making this policy real.
 for(let n=51;n<id;n++){
  if(!cleared(profile,n)||!terminalFlags(n).every(k=>has(profile.honroFlags,k)&&profile.honroFlags[k]===true))return false;
 }
 return true;
}

export function battleOwns(id,b) {
 return IDS.includes(id)&&b?.stage===id&&b.honroStage===id&&b.honroAuthoredId==='stage-'+id&&
  b.mode==='campaign'&&b.honroMapOrigin==='campaign'&&b.honroCanonical===true&&
  b.honroCustom===false&&b.honroAct6Revision===1;
}

// Returns staged event writes for the existing guarded outcome transaction.
// No standalone save, no rewards, no mutation on render/mount/replay/retry.
export function settlementPlan(profile,battle,packAuthorized,scope) {
 // Context is sampled by the caller from the actual App, not reconstructed
 // from battle bytes (embedded maps can still describe campaign stage data).
 if(scope?.embedded!==false||scope?.debug!==false||scope?.training!==false||scope?.custom!==false)return null;
 const id=battle?.honroStage;
 if(!battleOwns(id,battle)||!canEnter(profile,id,packAuthorized)||
    battle.phase!=='won'||battle.honroJourneyReplay!==false||cleared(profile,id))return null;
 const required=terminalFlags(id), local=battle.honroAct6?.flags;
 if(!required.every(k=>has(local,k)&&local[k]===true))return null;
 return Object.freeze(Object.fromEntries(required.map(k=>[k,true])));
}

export function lastStagePlan(profile, id, packAuthorized) {
 if(!canEnter(profile,id,packAuthorized))return null;
 const p=party(id);
 return {body:p,remoteAid:INSIDE.has(id)?'sodan-linked':null};
}
