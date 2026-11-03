import type {Battle,Unit,Vec} from './types';

/** Two authored archers must keep their local firing corridor instead of
 * retreating into a disconnected cleanup trip. Only voluntary AI destinations
 * are filtered. Existing poses, HP, impulses, projectiles and player inputs are
 * untouched, including when loading a save already beyond the corridor. */
export function cleanupDestinationAllowed(b:Battle,u:Unit,p:Vec,support:string):boolean{
 const battle=b as any,unit=u as any;
 if(battle.honroCustom||battle.honroAct4Official!==1||u.side!==1||u.enthrall||unit.eaterCapturedBy||unit.carriedBy!==undefined||!unit.honroPilotCombatBudget||unit.honroPilotRole!=='bow')return true;
 let maxX:number,supports:string[];
 if(battle.honroStage===31&&battle.honroAct4Preview===31&&battle.honroPilotRosterRevision===1&&u.id==='pilot31-ridge-court-3'&&unit.honroEncounterSupport==='approved31-upper-east'){
  maxX=6170;supports=['approved31-upper-east','approved31-east-return'];
 }else if(battle.honroStage===40&&battle.honroAct4Preview===40&&battle.honroFinalDefenseRevision===2&&u.id==='final40-dock-stair-5'&&unit.honroEncounterSupport==='approved40-dock-stair'){
  maxX=2360;supports=['approved40-dock-stair'];
 }else return true;
 // Knockback or an older save may already be outside. Permit paid inward
 // stepping stones, without snapping the actor to an authored endpoint.
 return supports.includes(support)&&(p.x<=maxX||u.x>maxX&&p.x<u.x-1);
}
