const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ids={56:'qa-act6-06',57:'a6-local-playable-07'};
const parked=['archer','knight','occultist'];
const wanted=['id','cls','hp','maxHp','focus','maxFocus','shield','level','loadout','tune','ranks','h','r','equipmentState','equipmentIds','gearBonuses','dead','attack','armor','maxMove','walkSpeed','regen'];
const intact=(row,view,cls)=>!!row&&!!view&&row.cls===cls&&row.side===0&&typeof row.id==='string'&&row.id!==''&&row.hp>0&&!row.dead&&!row.summoned&&row.equipmentState?.version===1&&wanted.every(k=>same(row[k],view[k]));
export const inNormalStage=(app,e,id)=>!!app&&app.engine===e&&app.stageId===id&&e?.b?.stage===id&&e.b.stageId===id&&e.b.honroStage===id&&e.b.honroCanonical===true&&e.b.honroAuthoredId==='stage-'+id&&e.b.mode==='campaign'&&e.b.honroMapOrigin==='campaign'&&e.b.honroJourneyReplay===false&&e.b.honroCustom===false&&!app.training&&!app.debugMode&&!app.customMap;
export function validateCarry(target,prev){
 if(!((target===56||target===57)&&prev?.stage===target-1&&prev.won===true))return false;
 const fields=target===56?['act6.outerThreeAnchorsReady','act6.outerAnchorBellReady']:['act6.firstGarmjinFailed','act6.temporaryPassageEscaped'];
 if(!fields.every(k=>prev.flags?.[k]===true))return false;
 const mage=target===56?prev.boundary?.fullParkedMage:prev.boundary?.fullMage;
 if(!intact(mage,prev.crew?.mage,'mage')||!parked.every(r=>intact(prev.boundary?.fullOuter?.[r],prev.crew?.[r],r)))return false;
 return new Set([mage.id,...parked.map(r=>prev.boundary.fullOuter[r].id)]).size===4;
}
// This factory must remain behind the current App's private owner closure.
// verifyPacket asserts own signed RAW source/media, not booleans on descriptors.
// stillOwnsPredecessor checks the live owner result identity (not deserialized JSON).
export function createNormalWarmPort({verifyPacket,stillOwnsPredecessor,authorizeCold=null}={}){
 if(typeof verifyPacket!=='function'||typeof stillOwnsPredecessor!=='function')throw TypeError('private source authority required');
 const grants=new WeakMap(),issued=new WeakSet();
 function prepare({id,app,previous,packet,descriptor,compiled,coldLease}){
  if(!ids[id]||app?.training||app?.debugMode||app?.customMap||!validateCarry(id,previous)||issued.has(previous)||
     verifyPacket({id,packet,descriptor,compiled})!==true||packet.authoredId!==ids[id]||packet.map.id!==ids[id]||descriptor.authoredId!==ids[id]||descriptor.id!==id)return null;
  const valid=coldLease!==undefined?((id===56||id===57)&&!app.engine&&authorizeCold?.(coldLease,app,previous,id)===true):
     app.engine?.b?.phase==='won'&&app.stageId===id-1&&stillOwnsPredecessor(app,previous,id-1)===true;
  if(!valid)return null;
  const bound={sourceId:ids[id],canonicalId:'stage-'+id,sourceDescriptor:descriptor,sourcePacket:packet,compiled};
  if(id===57){
    if(packet.bridge?.stageAuthId!==ids[id]||packet.bridge.pins?.source07?.sha256!==packet.baseInputSHA)return null;
    // only runtime owner alias changes; original separate source-07 pin / byte
    // fingerprint are never accepted if reconstructed from this projection.
    bound.canonicalBridge=Object.freeze({...packet.bridge,stageAuthId:bound.canonicalId});
  }
  const grant=Object.freeze({id,app,previous,bound:Object.freeze(bound)});
  grants.set(grant,{profile:app.profile,digest:JSON.stringify(app.profile),receipt:JSON.stringify(previous)});
  issued.add(previous);
  return grant;
 }
 function claim(grant,app,e,prepared,receipt){
  const lease=grant&&grants.get(grant);
  if(!lease||grant.app!==app||grant.previous!==receipt||lease.profile!==app.profile||
    lease.digest!==JSON.stringify(app.profile)||lease.receipt!==JSON.stringify(receipt)||!inNormalStage(app,e,grant.id)||!prepared?.units||e.b.units.length!==prepared.units.length||
    prepared.units.some((u,i)=>u!==e.b.units[i]))return null;
  grants.delete(grant);
  return grant.bound;
 }
 return Object.freeze({prepare,claim});
}
// Capture only inside the private installed objective/terminal callsite. The
// capability authority must first pin the real returned owner result object.
export function native56Handoff({app,engine:e,result,previous,isTerminal}={}){
 if(typeof isTerminal!=='function'||isTerminal(app,e,result)!==true||
    !inNormalStage(app,e,56)||e.b.phase!=='won'||!validateCarry(56,previous)||
    result?.stage!==56||result.won!==true||result.settlement!==false||
    !result.events?.includes('exitReached')||
    !result.reflow?.some(v=>v.key==='native-reversal')||!result.reflow?.some(v=>v.key==='native-evade')||
    result.flags?.['act6.firstGarmjinFailed']!==true||result.flags?.['act6.temporaryPassageEscaped']!==true)return null;
 const units=e.b.units.filter(u=>u.side===0&&!u.summoned&&!u.enthrall),mage=units[0];
 if(units.length!==1||mage.id!==previous.boundary.fullParkedMage.id||!e.grounded(mage)||result.actors?.length!==4||
    !intact(mage,result.actors.find(u=>u.cls==='mage'),'mage')||
    !parked.every(r=>intact(previous.boundary.fullOuter[r],result.actors.find(u=>u.cls===r),r)))return null;
 const fullOuter=structuredClone(previous.boundary.fullOuter),fullMage=structuredClone(mage);
 return {stage:56,won:true,settlement:false,flags:structuredClone(result.flags),crew:{mage:fullMage,...fullOuter},
 boundary:{fullMage,fullOuter,events:structuredClone(result.events),reflow:structuredClone(result.reflow),...(result.interiorD?{interiorD:structuredClone(result.interiorD)}:{})}};
}
