import assert from 'node:assert/strict';
import vm from 'node:vm';
import {mkdir,writeFile} from 'node:fs/promises';
import {buildCore} from '../game/engine/build.mjs';
import {legacySpHooks} from './lib/sp-balance-baseline.mjs';
const g=vm.createContext({console,performance,structuredClone});vm.runInContext(await buildCore(),g);const C=g.HONRO_CORE,old=legacySpHooks(C);
const clone=x=>JSON.parse(JSON.stringify(x)),passives=C.TALENTS.filter(t=>t.passive),rows=[],training=[];
const hero=(cls,level=15)=>({...C.freshHero(cls),xp:C.xpAtLevel(level)});
const statCache=new Map();const live={stats(h,cls){const k=cls+':'+h.xp+':'+(h.statTraining||0)+':'+JSON.stringify(h.ranks);if(!statCache.has(k)){if(statCache.size>3000)statCache.clear();statCache.set(k,C.heroStats(h,cls));}return statCache.get(k);}};
const marginal=(h,a,cls,s,hooks=live)=>C.spMarginal(C.spBuildAxes(h,cls,s,hooks),C.spBuildAxes(a,cls,s,hooks),s.weights[cls]);
let legalChecks=0,archerWins=0,archerComparisons=0;
assert.equal(C.MAX_LEVEL,30);assert.equal(passives.length,20);
for(const cls of C.CLASS_IDS)for(let level=1;level<=C.MAX_LEVEL;level++){
 const base=hero(cls,level);
 for(let n=0;n<=Math.min(59,C.pointsLeft(base,cls)-1);n++){
  const h=clone(base);h.statTraining=n;const a=clone(h);assert(C.investStat(a,cls));
  for(const s of C.SP_SCENARIOS){const now=marginal(h,a,cls,s),before=marginal(h,a,cls,s,old);assert(Object.values(now.axes).every(v=>v>=-1e-12));assert(now.utility>0);training.push({cls,level,rank:n+1,scenario:s.id,before:before.utility,after:now.utility,...Object.fromEntries(Object.entries(before.axes).map(([k,v])=>["before_"+k,v])),...Object.fromEntries(Object.entries(now.axes).map(([k,v])=>[k,v]))});}
 }
}
for(const t of passives)for(let level=1;level<=C.MAX_LEVEL;level++)for(let rank=1;rank<=8;rank++){
 if(level<C.requiredRankLevel(t,rank))continue;
 const base=hero(t.cls,level);for(let r=1;r<rank;r++)assert(C.train(base,t.id));
 const maxN=Math.min(60,C.pointsLeft(base,t.cls)-1);
 for(let n=0;n<=maxN;n++){
  if(t.id!=='AP02'&&n!==0&&n!==Math.floor(maxN/2)&&n!==maxN)continue;
  const h=clone(base);h.statTraining=n;const a=clone(h);assert(C.train(a,t.id));assert.equal(C.pointsSpent(a,t.cls),C.pointsSpent(h,t.cls)+1);legalChecks++;
  if(t.id==='AP02'&&n<60){const training=clone(h);assert(C.investStat(training,t.cls));const s=C.SP_SCENARIOS[0],own=marginal(h,a,t.cls,s),general=marginal(h,training,t.cls,s);archerComparisons++;if(own.axes.offense>general.axes.offense)archerWins++;}
  for(const s of C.SP_SCENARIOS){const m=marginal(h,a,t.cls,s);assert(Object.values(m.axes).every(v=>v>=-1e-12),`${t.id}/${rank} regressed`);if(s.id==='specialist-12-turn')assert(m.utility>0,`${t.id}/${rank} has no supported value`);}
 }
}
for(const t of passives)for(let rank=1;rank<=8;rank++)for(const s of C.SP_SCENARIOS){
 const h=hero(t.cls,15);for(let r=1;r<rank;r++)assert(C.train(h,t.id));const a=clone(h);assert(C.train(a,t.id));const tr=clone(h);assert(C.investStat(tr,t.cls));const before=marginal(h,a,t.cls,s,old),after=marginal(h,a,t.cls,s),alternative=marginal(h,tr,t.cls,s);
 rows.push({id:t.id,name:t.name,rank,scenario:s.id,before:before.utility,after:after.utility,training:alternative.utility,ratio:after.utility/alternative.utility,...Object.fromEntries(Object.entries(before.axes).map(([k,v])=>["before_"+k,v])),...Object.fromEntries(Object.entries(after.axes))});
}
// Fixed-role gate is separate from class-mixed diagnostics. Acquisition changes what a
// build can do; rank 2–8 gets no credit for the rank-one unlock a second time.
const roleRows=[];
for(const level of [5,15,30])for(const t of passives)for(let rank=1;rank<=8;rank++){
 if(level<C.requiredRankLevel(t,rank))continue;
 const h=hero(t.cls,level);if(C.pointsLeft(h,t.cls)<rank)continue;
 h.ranks[t.id]=rank-1;const a=clone(h),tr=clone(h);assert(C.train(a,t.id));assert(C.investStat(tr,t.cls));
 const s=C.SP_SCENARIOS[1],weights=C.SP_ROLES[C.SP_PASSIVE_ROLES[t.id]],before=C.spBuildAxes(h,t.cls,s),own=C.spMarginal(before,C.spBuildAxes(a,t.cls,s),weights),training=C.spMarginal(before,C.spBuildAxes(tr,t.cls,s),weights),ratio=own.utility/training.utility;
 const oldBefore=C.spBuildAxes(h,t.cls,s,old),oldOwn=C.spMarginal(oldBefore,C.spBuildAxes(a,t.cls,s,old),weights),oldTraining=C.spMarginal(oldBefore,C.spBuildAxes(tr,t.cls,s,old),weights);
 roleRows.push({level,id:t.id,rank,role:C.SP_PASSIVE_ROLES[t.id],beforeRatio:oldOwn.utility/oldTraining.utility,ratio,beforePassive:oldOwn.utility,beforeTraining:oldTraining.utility,passive:own.utility,training:training.utility});
 if(rank===1)continue;
 // Existing front-loaded hit count, armor/resistance and jump breakpoints are explicit
 // exceptions, not a blanket 14-fold acceptable band. They are not buffed to match a score.
 const upper=t.id==='AP01'&&rank===2?4.6:t.id==='AP01'&&rank===3?3.0:t.id==='SP02'&&rank<=3?2.6:t.id==='SP03'?3.6:2.2;
 assert(ratio>=.50,`${t.id} Lv${level} rank ${rank}: role ratio ${ratio} below .5`);
 assert(ratio<=upper,`${t.id} Lv${level} rank ${rank}: role ratio ${ratio} above ${upper}`);
}
// These are mathematical contracts for the declared scenario, not promises about every encounter.
assert.equal(archerWins,archerComparisons,'AP02 must beat generalist training in basic expected damage at every legal level/rank/training boundary');
const report={legalChecks,archerWins,archerComparisons,scenarios:clone(C.SP_SCENARIOS),roles:clone(C.SP_ROLES),roleRows,rows,training};
await mkdir('_local/reports/sp-balance',{recursive:true});await writeFile('_local/reports/sp-balance/marginals.json',JSON.stringify(report,null,2));
for(const [name,list] of [['passive-marginals',rows],['training-marginals',training],['role-marginals',roleRows]]){const keys=Object.keys(list[0]);await writeFile(`_local/reports/sp-balance/${name}.csv`,keys.join(',')+'\n'+list.map(r=>keys.map(k=>r[k]).join(',')).join('\n')+'\n');}
console.log(JSON.stringify({legalChecks,archerWins,archerComparisons,range:[Math.min(...training.map(x=>x.after)),Math.max(...training.map(x=>x.after))],specialist:rows.filter(x=>x.scenario==='specialist-12-turn').reduce((o,r)=>(o[r.id]??=[],o[r.id].push(+r.ratio.toFixed(2)),o),{})},null,2));
