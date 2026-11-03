import type {Battle,Unit} from './types';
/** Honor an already displayed/responded Stage40 pilot warning within the existing
 * enemy action cap. No promotion before observation or a player response. */
export function readyFinaleWarning(b:Battle,u:Unit):boolean{
 const battle=b as any,unit=u as any;
 if(battle.honroStage!==40||battle.honroAct4Preview!==40||battle.honroFinalDefenseRevision!==2||!(battle.honroAct4Official===1||battle.honroCustom))return false;
 if(unit.side!==1||unit.dead||unit.hp<=0||unit.carriedBy!==undefined||unit.eaterCapturedBy||unit.enthrall)return false;
 const equipped=unit.honroAct4FinaleBoss===true&&unit.boss===40||unit.honroPilotMidboss==='harbor'&&!unit.boss&&!unit.honroAct4WreckBoss;
 const state=unit.honroPilotCombat,target=state?.target;
 return !!(equipped&&state?.phase==='telegraph'&&target?.seen&&target.response&&(b.teamEnds?.[0]||0)>target.seenTeamEnd);
}
