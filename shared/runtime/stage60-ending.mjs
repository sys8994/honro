import assert from 'node:assert/strict';
const expected=['archer','knight','mage','occultist'];
const order=['last-souls','bridge-record','daybreak','later-return'];
const persistedFlag='act6.endingCompleted';
const safeName=x=>typeof x==='string'&&x.trim()===x&&x.length>=2&&x.length<=36&&!/[<>\r\n]/.test(x);
export function prepareEnding({validated09,grounded,afterFinalCommit=null,verifyFinalFrame=null}){
 assert(typeof grounded==='function');
 let finalWitness=null, notes=null, scene=0, receipt=null, busy=false, finalView=null,recordWitness=null,partyRefs=null,atMainGate=null;
 function begin({battle,party,souls,mainGate,soulGate}){
  if(finalWitness||!battle||battle.phase!=='won'||!mainGate||!soulGate||!Array.isArray(souls)||!souls.length)return false;
  if(!party||party.length!==4||party.map(u=>u.cls).sort().join()!==expected.join()||new Set(party.map(u=>u.id)).size!==4)return false;
  if(party.some(u=>u.side!==0||u.dead||u.hp<=0||!grounded(u)||!mainGate(u))||
     souls.some(u=>u.side!==2||u.dead||u.hp<=0||!grounded(u)||!soulGate(u)))return false;
  const chain=validated09();
  if(!chain?.verified09||!chain.correctedGarmjin||!chain.truePlayableFour||!chain.realRouteClear)return false;
  if(!Array.isArray(chain.guardWitnesses)||!chain.gwakjin?.event||chain.gwakjin.name!=='곽진'||!safeName(chain.gwakjin.name)||!chain.guardWitnesses.length)return false;
  const names=chain.guardWitnesses.map(x=>x.name);
  if(chain.guardWitnesses.some(x=>!x.actorId||!x.event||!safeName(x.name)||x.name===chain.gwakjin.name)||new Set(names).size!==names.length)return false;
  if(!chain.terminalSha||!chain.slotEndingReceiptKey)return false;
  notes={chain,names};partyRefs=party.slice();atMainGate=mainGate;finalWitness={actors:party.map(u=>u.id),souls:souls.map(u=>u.id),terminalSha:chain.terminalSha};
  return true;
 }
 const view=()=>({scene:finalWitness?order[scene]:null,ready:!!finalWitness,receipt,
  ...(finalWitness&&scene===1?{record:{actor:'휘겸',subject:notes.chain.gwakjin.name,guards:notes.names,recorded:!!recordWitness,beat:recordWitness?[['설오','다 적으셨습니까?'],['휘겸','빠뜨린 이가 없는지, 한 번만 더 보겠소.']]:[['휘겸','길은 남겼군.']]}}:{}),
  ...(finalWitness&&scene===2?{time:'07:10',visual:'old lantern extinguished; first normal daylight'}:{}),
  ...(finalWitness&&scene===3?{time:'some time later',actor:'담허',body:'living physical body',line:'내 발로 가네. 해 지기 전 돌아오리다.'}:{})});
 function recordBridgeNames({actor,action}){
  if(!finalWitness||scene!==1||recordWitness||action!=='name-the-bridge-guard'||actor!==partyRefs.find(u=>u.cls==='knight')||
   actor.side!==0||actor.hp<=0||actor.dead||!grounded(actor)||!atMainGate(actor))return false;
  recordWitness={by:actor.id,people:[notes.chain.gwakjin.name,...notes.names]};
  return true;
 }
 function acceptFinalFrame(proof){
  if(!finalWitness||scene!==order.length-1||finalView||!verifyFinalFrame?.(proof,notes.chain))return false;
  finalView=proof;return true;
 }
 async function advance(input){
  if(!finalWitness||busy||receipt||input!==order[scene])return {ok:false,reason:'wrong-or-closed-scene'};
  if(scene===1&&!recordWitness)return {ok:false,reason:'hwigyeom-has-not-recorded-names'};
  if(scene<order.length-1){scene++;return {ok:true,done:false,view:view()};}
  if(!finalView)return {ok:false,reason:'final-scene-frame-not-verified'};
  if(!afterFinalCommit)return {ok:false,reason:'no-authorized-final-store'};
  busy=true;
  try{
   const committed=await afterFinalCommit({
    key:notes.chain.slotEndingReceiptKey, flag:persistedFlag, finalScene:order[scene],
    terminalSha:notes.chain.terminalSha,witness:finalWitness,guards:notes.names,recordWitness,frameProof:finalView
   });
   if(!committed?.ok)return {ok:false,reason:'final-store-rejected'};
   receipt=committed;return {ok:true,done:true,view:view()};
  }finally{busy=false;}
 }
 return {begin,view,advance,recordBridgeNames,acceptFinalFrame};
}
