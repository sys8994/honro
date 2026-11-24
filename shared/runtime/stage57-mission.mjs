import {mountEmergency57} from './stage57-emergency.mjs';
import {createStage57Owner} from './stage57-owner.mjs';
const privateWrite = new WeakSet();
export function createStage57Mission({G,authorize,earlierResult,isDetachedFixture=()=>false}){
 const tail= createStage57Owner({G,authorize,earlierResult,isDetachedFixture});
 return function mountStage57({...cfg}){
  const {engine,activation,pack,previous,carriedProfile,heroes,foes,keeper}=cfg,b=engine?.b;
  if(activation?.enabled!==true||activation.integerStageKey!==57||!b||privateWrite.has(engine)||!authorize({engine,activation,pack}))return null;
  if(!isDetachedFixture(activation,engine)&&!(b.mode==='campaign'&&b.honroStage===57&&b.stage===57&&b.honroAuthoredId==='stage-57'&&b.honroMapOrigin==='campaign'&&b.honroCustom===false&&b.honroCanonical===true&&b.honroJourneyReplay===false&&activation.embedded===false&&activation.training===false&&activation.custom===false&&activation.debug===false))return null;
  const trusted=earlierResult(previous,b,pack);
  if(!trusted?.won||!trusted.flags?.['act6.temporaryPassageEscaped']||JSON.stringify(trusted.profile)!==JSON.stringify(carriedProfile))return null;
  const authority=Object.freeze({engine,b});
  const early=mountEmergency57({G,engine,authority,authorize:(v,e)=>v===authority&&e===engine&&e.b===b,heroes,foes,observe:cfg.observe});
  if(!early)return null;
  privateWrite.add(engine);
  let physical=null;
  const actual=()=>engine.b===b;
  function update(){
   if(!actual())return null;
   early.inspect();const f=early.read();
   if(f.loss)return Object.freeze({id:57,won:false,reason:f.loss});
   if(!f.ready)return null;
   if(!physical&&b.phase==='aim'&&b.side===0&&engine.canAct()&&!b.projectiles.length){
    const offer=tail({engine,activation,pack,previous,carriedProfile,keeper,roster:heroes.map(a=>a.id)});
    if(!offer.accepted)return null;
    physical=offer;
   }
   const joined=engine.unit(trusted.actor.id);
   if(physical?.read().association&&joined?.dead)return Object.freeze({id:57,won:false,reason:'corporeal-darmheo-fallen'});
   return physical?.nativePosition()??null;
  }
  return Object.freeze({
   interaction(type,actor=engine.active,other=null){
    if(!actual()||!engine.canAct()||b.side!==0||actor!==engine.active)return false;
    const f=b.honroState.flags;
    if(!f.bellSiteEmergencyStabilized&&['warnBell','repairRelay','splitRepair'].includes(type))return early.interact(type==='splitRepair'?'split-ward':'full-relay');
    if(f.bellSiteEmergencyStabilized&&!f.bridgeRetreatOpened&&['warnRailing','openRetreat'].includes(type))return early.interact();
    if(f.bridgeRetreatOpened&&!f.relayMovedToFallback&&type==='moveRelayToFallback')return early.interact();
    if(!physical)return false;
    if(type==='assistKeeper')return physical.startKeeper();
    if(type==='receiveKeeperWatch')return physical.claimKeeper(actor,other);
    if(type==='reuniteAtWard')return physical.reunite(actor);
    return false;
   },
   position:update,
   settlement(receipt){return actual()?physical?.settlement(receipt)??null:null;},
   read:()=>({emergency:early.read(),reunion:physical?.read()??null,scope:'one actual attempt'})
  });
 };
}
