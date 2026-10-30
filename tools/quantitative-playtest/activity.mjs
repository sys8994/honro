/** Passive action evidence: planning/retry calls never imply executed pressure. */
export class EnemyActivity {
 constructor(){this.planning=new Map();this.actual=new Map();this.starts=new Map();}
 add(map,round,id,kind){const actors=map.get(round)||new Map(),kinds=actors.get(id)||new Set();const fresh=!kinds.has(kind);kinds.add(kind);actors.set(id,kinds);map.set(round,actors);return fresh;}
 begin(u,round,units){if(u?.side!==1)return;this.add(this.planning,round,u.id,'planning');const key=round+':'+u.id;if(!this.starts.has(key))this.starts.set(key,units.filter(v=>v.side===1).map(v=>({id:v.id,hp:v.hp,shield:v.shield||0})));}
 executed(u,round,kind){return u?.side===1&&this.add(this.actual,round,u.id,kind);}
 finish(u,round,units){const start=this.starts.get(round+':'+u?.id);if(u?.side!==1||!start)return false;const support=start.some(p=>{const v=units.find(v=>v.id===p.id);return v&&(v.hp>p.hp||(v.shield||0)>p.shield);});return support&&this.executed(u,round,'observed-support-change');}
 summary(){const max=m=>Math.max(0,...[...m.values()].map(x=>x.size));return {maxEnemyPlanningParticipantsPerRound:max(this.planning),maxActingEnemiesPerRound:max(this.actual),enemyActivityByRound:[...this.actual].map(([round,actors])=>({round,actors:[...actors].map(([id,kinds])=>({id,kinds:[...kinds]}))}))};}
}
/** Drop is free and initially grounded: acceptance is the new production prepare state. */
export function acceptedDrop(previous,current){return !previous&&current?.phase==='prepare'&&current.elapsed===0&&Number.isFinite(current.originY)&&Array.isArray(current.contacts)&&current.contacts.length>0;}
