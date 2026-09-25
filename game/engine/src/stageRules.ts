import type { Battle, Stage, Unit } from './types';

export interface StageEndState { win:boolean; lose:boolean; reason:string; }
export type StageEventTrigger = 'start'|'round'|'unit-dead'|'position'|'objective';

/**
 * Central stage-resolution seam for future story/event encounters.
 * Existing stages do not define victoryRule, so legacy behavior is preserved exactly.
 */
export function evaluateStageEnd(stage:Stage,b:Battle,heroes:Unit[],enemies:Unit[],objective?:Unit,boss?:Unit):StageEndState{
 if(!heroes.length)return {win:false,lose:true,reason:'이번 전투의 경험치는 유지됩니다.'};
 if(objective?.dead)return {win:false,lose:true,reason:'보호 대상이 쓰러졌습니다.'};
 const rule=stage.victoryRule;
 if(rule){
  switch(rule.kind){
   case 'boss': if(boss?.dead)return {win:true,lose:false,reason:stage.outro}; break;
   case 'survive': if(b.round>(rule.rounds||1))return {win:true,lose:false,reason:stage.outro}; break;
   case 'capture': {
    const target=rule.target;
    if(target&&b.events.includes(`captured:${target}`))return {win:true,lose:false,reason:stage.outro};
    break;
   }
   case 'scripted': if(rule.target&&b.events.includes(`victory:${rule.target}`))return {win:true,lose:false,reason:stage.outro}; break;
   case 'escort': if(b.events.includes(`escort:complete${rule.target?':'+rule.target:''}`))return {win:true,lose:false,reason:stage.outro}; break;
   case 'clear': {
    const wards=stage.objective==='wards'&&b.terrain.some(t=>t.device==='ward'&&!t.broken);
    if(!enemies.length&&!wards)return {win:true,lose:false,reason:stage.outro};
    break;
   }
  }
  return {win:false,lose:false,reason:''};
 }
 // Legacy campaign semantics.
 if(b.mode==='campaign'&&stage.boss&&boss?.dead)return {win:true,lose:false,reason:stage.outro};
 if(!enemies.length){
  const wards=b.mode==='campaign'&&stage.objective==='wards'&&b.terrain.some(t=>t.device==='ward'&&!t.broken);
  if(!wards)return {win:true,lose:false,reason:stage.outro};
 }
 return {win:false,lose:false,reason:''};
}

/** Returns declarative hooks due for a trigger. Execution is intentionally not hard-coded yet. */
export function dueStageEvents(stage:Stage,b:Battle,trigger:StageEventTrigger){
 return (stage.eventScript||[]).filter(ev=>ev.when===trigger&&(ev.round===undefined||ev.round===b.round)&&(!ev.once||!b.events.includes(`event:${ev.id}`)));
}
