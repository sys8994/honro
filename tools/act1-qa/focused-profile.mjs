/** Declared alternative entry allocation using ONLY existing earned XP/SP.
 * No earned-history claim; resets/allocates talents before battle initialization.
 * Failed prerequisites/levels/SP are recorded and never overwritten. */
export function focusedProfile(g,p){const C=g.HONRO_CORE,log=[];
 const plans={archer:{skills:['A14','A02','A11'],passives:['AP01','AP01','AP01','AP01','AP04','AP04','AP02']},mage:{skills:['M06','M04','M11'],passives:['MP01','MP01','MP01','MP02','MP02']},knight:{skills:['S09','S08'],passives:['SP01','SP01','SP02','SP02','SP02']}};
 for(const cls of p.recruited){if(!plans[cls])continue;const hero=p.heroes[cls],xp=hero.xp;C.resetTalents(hero,cls);
  function train(id){const t=C.TALENT_MAP[id];if(!t)return false;if(t.prereq&&!hero.ranks[t.prereq]&&!train(t.prereq))return false;const ok=C.train(hero,id);log.push({cls,id,ok,reason:ok?'existing earned SP':C.trainReason(hero,id)});return ok;}
  for(let i=0;i<3;i++){const ok=C.investStat(hero,cls);log.push({cls,stat:true,ok});}
  for(const id of plans[cls].skills)if(!hero.ranks[id])train(id);
  for(const id of plans[cls].passives)train(id);
  p.loadouts[cls]=[C.baseSkill(cls),...plans[cls].skills.filter(id=>hero.ranks[id])].slice(0,4);C.sanitizeLoadout(p,cls);
  if(hero.xp!==xp||C.pointsSpent(hero,cls)>C.pointsEarned(hero))throw Error('Invalid entry allocation');
 }
 return log;
}
