import type {Battle,Unit,Vec} from './types';

/** The Stage31 ridge archer keeps its local firing corridor instead of
 * retreating into a disconnected cleanup trip. Only voluntary AI destinations
 * are filtered. Existing poses, HP, impulses, projectiles and player inputs are
 * untouched, including when loading a save already beyond the corridor. */
export function cleanupDestinationAllowed(b:Battle,u:Unit,p:Vec,support:string,currentSupport:string|undefined):boolean{
 const battle=b as any,unit=u as any;
 if(battle.honroCustom||battle.honroAct4Official!==1||u.side!==1||u.enthrall||unit.eaterCapturedBy||unit.carriedBy!==undefined||!unit.honroPilotCombatBudget||unit.honroPilotRole!=='bow')return true;
 let maxX:number,supports:string[];
 if(battle.honroStage===31&&battle.honroAct4Preview===31&&battle.honroPilotRosterRevision===1&&u.id==='pilot31-ridge-court-3'&&unit.honroEncounterSupport==='approved31-upper-east'){
  maxX=6170;supports=['approved31-upper-east','approved31-east-return'];
 }else return true;
 // A legacy save or a physical impulse may put this actor on another layer.
 // Keep its original planner there: forcing a direct return can remove every
 // reachable stepping stone. Stage40 always keeps its original planner.
 if(!currentSupport||!supports.includes(currentSupport))return true;
 // Knockback or an older save may already be outside. Permit paid inward
 // stepping stones, without snapping the actor to an authored endpoint.
 return supports.includes(support)&&(p.x<=maxX||u.x>maxX&&p.x<u.x-1);
}
