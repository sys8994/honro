import {createFixedWriter} from '../stage60-stock-save-race/writer-fixed.mjs';
// The App must grant this same lock to its other writers for its exact slot.
// No fallback to unlocked writes, ephemeral in-memory or cross-origin storage.
export function createEndingWritePort({authorize,ownedSlot,readSameSlot,normalize,locks}){
 if([authorize,ownedSlot,readSameSlot,normalize].some(x=>typeof x!=='function'))throw TypeError('60 same-slot ports unavailable');
 return async function writeFinal(app,e,proof,request,stillCurrent){
  const slot=ownedSlot(app,e,proof);
  if(!locks||typeof locks.request!=='function'||typeof slot!=='string'||!/^[A-Za-z0-9:_-]{1,100}$/.test(slot)||!stillCurrent()||
    !authorize(app,e,proof)||!app.profile?.equipment?.runId||proof.runId!==app.profile.equipment.runId||
    !Array.isArray(proof.guard?.roleIds)||proof.guard.roleIds.length!==3||
    proof.guard.actor!==request.recordWitness?.by)return {ok:false,reason:'60-live-slot-or-mutex-unavailable'};
  const seal=Object.freeze({key:proof.endingKey,terminalSha:proof.rawSHA,knight:proof.guard.actor,runId:proof.runId,actorIds:proof.guard.roleIds.slice(),
   names:[proof.names.gwakjin.name,...proof.names.guardWitnesses.map(v=>v.name)]});
  const own=()=>stillCurrent()&&authorize(app,e,proof)&&ownedSlot(app,e,proof)===slot;
  const writer=createFixedWriter({app,seal,authorize:(candidate,a)=>candidate===seal&&a===app&&own(),
    frame:request.frameProof,readCurrentExact:()=>own()?readSameSlot(slot):null,normalize,
    runExclusive:fn=>locks.request('honro:profile-slot:'+slot,{mode:'exclusive'},()=>own()?fn():{ok:false,reason:'60-slot-authority-changed'})});
  return writer?writer(request):{ok:false,reason:'60-writer-unavailable'};
 };
}
