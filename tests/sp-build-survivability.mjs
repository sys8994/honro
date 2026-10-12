import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {runtime} from '../game/tests/helpers.mjs';
import {legacySpHooks} from './lib/sp-balance-baseline.mjs';
const g=await runtime({legacyMaps:false}),C=g.HONRO_CORE,old=legacySpHooks(C),rows=[];
const roots={mage:['M06','M03'],archer:['A14','A05'],knight:['S03','S01','S09'],occultist:['O06','O02','O11']};
const passives={mage:['MP01','MP02','MP04'],archer:['AP02','AP01','AP04'],knight:['SP01','SP02','SP03'],occultist:['OP01','OP02','OP03']};
function allocate(cls,xp,mode){
 const h={...C.freshHero(cls),xp};for(const id of roots[cls])if(!h.ranks[id]&&!C.trainReason(h,id))C.train(h,id);
 if(mode==='mixed'){const count=Math.floor(C.pointsLeft(h,cls)*.5);for(let i=0;i<count;i++)assert(C.investStat(h,cls));let stop=80;while(stop--){const id=passives[cls].filter(id=>!C.trainReason(h,id)).sort((a,b)=>(h.ranks[a]||0)-(h.ranks[b]||0))[0];if(!id)break;C.train(h,id);}}
 while(C.investStat(h,cls)){}return h;
}
for(const stage of [1,8,16,24,30]){
 const st=g.HONRO_CONTENT.stages[stage-1],xp=g.HonroProgression.entryHero(st).xp,p=C.defaults();p.recruited=C.CLASS_IDS;p.party=C.CLASS_IDS;
 for(const cls of C.CLASS_IDS)p.heroes[cls]=allocate(cls,xp,'mixed');
 const b=g.HonroWorld.build(st,p,false,'archer','A01'),e=new C.Engine(b),enemies=b.units.filter(u=>u.side===1&&!u.boss&&!u.honroMidboss);
 assert(enemies.length,`stage ${stage} needs actual authored threats`);
 const attacks=enemies.flatMap(u=>u.loadout.map(id=>({u,s:C.SKILLS[id]})).filter(({s})=>s?.damage>0).map(({u,s})=>({u,s,raw:e.effective(s,u).damage}))).sort((a,b)=>a.raw-b.raw);
 const threat=attacks[Math.min(attacks.length-1,Math.floor(attacks.length*.9))];assert(threat);
 const medianEnemy=[...enemies].sort((a,b)=>a.maxHp-b.maxHp)[Math.floor(enemies.length/2)],medianHp=medianEnemy.maxHp;
 for(const cls of C.CLASS_IDS)for(const mode of ['training-heavy','mixed']){
  const h=allocate(cls,xp,mode),before=old.stats(h,cls),after=C.heroStats(h,cls),s=C.SP_SCENARIOS[0];
  const oldAxes=C.spBuildAxes(h,cls,s,old),newAxes=C.spBuildAxes(h,cls,s);
  // Same authored 90th-percentile ordinary single contact, same target armor law.
  // Does not claim multi-hit/boss/terrain survivability or a complete playable campaign.
  const target=C.makeUnit(cls,0,0,0),incomingExistence=C.existenceMultiplier(C.attackForSkill(threat.s),target,threat.u);
  const damage=v=>threat.raw*(1-Math.min(.7,v.armor))*incomingExistence;
  const oldHits=before.hp/damage(before),newHits=after.hp/damage(after);
  assert(newHits>2,`${cls} ${mode} stage${stage} falls below two ordinary contacts`);
  const basic=C.SKILLS[C.baseSkill(cls)],baseDamage=basic.damage*C.skillBalanceFactor(basic),outgoingExistence=C.existenceMultiplier(C.attackForSkill(basic),medianEnemy,target);
  const basicHit=(stats,tuning)=>baseDamage*stats.attack*(1+Math.min(.8,stats.critChance)*(Math.min(3.5,stats.critMultiplier)-1))*(1-Math.min(.7,medianEnemy.armor))*outgoingExistence*(cls==='knight'?.88+(.47+tuning(h.ranks.SP01||0).swordCharge)*.5:1);
  rows.push({stage,level:C.levelOf(h),cls,mode,sp:C.pointsSpent(h,cls),statTraining:h.statTraining,ranks:h.ranks,threat:threat.u.id,skill:threat.s.id,rawHit:threat.raw,incomingExistence,oldHp:before.hp,newHp:after.hp,oldHits,newHits,oldBasicHitEquivalents:medianHp/basicHit(before,old.tuning),newBasicHitEquivalents:medianHp/basicHit(after,C.passiveTuning),offenseRatio:newAxes.offense/oldAxes.offense,ehpRatio:(after.hp/(1-after.armor))/(before.hp/(1-Math.min(.7,before.armor))),oldPaidActions:oldAxes.sustain,newPaidActions:newAxes.sustain});
 }
}
await mkdir('_local/reports/sp-balance',{recursive:true});await writeFile('_local/reports/sp-balance/build-threats.json',JSON.stringify(rows,null,2));
console.log('PASS',rows.length,'same-allocation authored-stage threat comparisons; minimum ordinary-contact capacity',Math.min(...rows.map(r=>r.newHits)).toFixed(2));
console.log('Training-heavy ratio ranges',JSON.stringify({offense:rows.filter(r=>r.mode==='training-heavy').map(r=>r.offenseRatio).reduce((a,v)=>[Math.min(a[0],v),Math.max(a[1],v)],[Infinity,0]),ehp:rows.filter(r=>r.mode==='training-heavy').map(r=>r.ehpRatio).reduce((a,v)=>[Math.min(a[0],v),Math.max(a[1],v)],[Infinity,0])}));
