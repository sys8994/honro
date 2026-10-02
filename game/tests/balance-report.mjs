import {runtime,battlefield,gameRoot} from './helpers.mjs';
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const g=await runtime(),rows=[];
for(let id=1;id<=g.HONRO_CONTENT.stages.length;id++){const {b,st}=battlefield(g,id);rows.push(g.HonroDifficulty.audit(st,b));}
const schedule=[];let previous=1,index=0;
for(const act of [...g.HONRO_CONTENT.acts.map(a=>({act:a.id,stageExitLevels:g.HONRO_BALANCE.stages.slice(a.first-1,a.last).map(s=>s.exitLevel)})),...g.HONRO_BALANCE.futureActs]){
  for(const [i,level]of act.stageExitLevels.entries()){
    const xp=g.HonroProgression.xpAt(level),start=g.HonroProgression.xpAt(previous);
    schedule.push({stage:++index,act:act.act,actStage:i+1,entryLevel:previous,exitLevel:level,totalXp:xp,stageXpBudget:xp-start,implemented:act.act<=2});previous=level;
  }
}
await writeFile(path.join(gameRoot,'../_local/game-reports/balance.json'),JSON.stringify({version:2,assumptions:{difficulty:'normal',reference:'Archer A01, tuning 0.5; rank 1/2/3 at entry levels 1/4/7',roundAccuracy:.55,note:'Analytical damage budgets, not measured player completion times.'},rows,schedule},null,2)+'\n');
await writeFile(path.join(gameRoot,'../_local/game-reports/level-schedule.csv'),[Object.keys(schedule[0]).join(','),...schedule.map(r=>Object.values(r).join(','))].join('\n')+'\n');
console.table(rows.map(({stage,entryLevel,exitLevel,initialEnemies,reinforcements,activeLimit,medianHitsToKill,medianEnemyHitHpPercent,combatXpBudget,totalXpBudget,status})=>({stage,entryLevel,exitLevel,initialEnemies,reinforcements,activeLimit,medianHitsToKill,medianEnemyHitHpPercent,combatXpBudget,totalXpBudget,status})));
assert.ok(rows.every(r=>!r.issues.length),'Encounter budgets outside the configured acceptance bands');
