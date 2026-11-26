// The live Stage 52 owner supplies the four gathered actors. No profile writes:
// the native 52→53 checkpoint carries the resulting actor snapshots.
export function thresholdPrepChoices(C,profile,actors,u){
 const known=C.knownSkills({...profile.heroes[u.cls],ranks:u.ranks},u.cls)
  .filter(id=>C.SKILLS[id]?.cls===u.cls&&!C.SKILLS[id].passive&&!C.SKILLS[id].basic&&!C.SKILLS[id].enemyOnly);
 const equipment=(profile.equipment?.ownedItemIds??[]).filter(id=>{
  const item=C.EQUIPMENT_MAP[id];
  return !!item&&(!item.characterClass||item.characterClass===u.cls)&&
   !actors.some(other=>other!==u&&other.equipmentIds?.includes(id));
 });
 return {known,equipment};
}
export function planThresholdPrep(C,profile,actors,draft){
 if(!draft)return [];
 if(actors.length!==4||new Set(actors.map(u=>u.cls)).size!==4||Object.keys(draft).length!==4)return null;
 try{
  const changes=[];
  for(const u of actors){
   const v=draft[u.cls],base=C.baseSkill(u.cls),available=thresholdPrepChoices(C,profile,actors,u);
   if(!v||!Array.isArray(v.skills)||v.skills.length!==3||!Array.isArray(v.gear)||v.gear.length!==2)return null;
   const skills=v.skills.filter(Boolean),gear=v.gear.filter(Boolean);
   if(v.skills.some(id=>typeof id!=='string')||new Set(skills).size!==skills.length||
    skills.some(id=>!available.known.includes(id))||
    v.gear.some((id,i)=>typeof id!=='string'||id&&(!available.equipment.includes(id)||C.EQUIPMENT_MAP[id].slot!==['personal','common'][i])))return null;
   const slots=[base,...v.skills];
   const skillChanged=slots.some((id,i)=>id!==(u.loadout[i]??''));
   const gearChanged=gear.length!==(u.equipmentIds?.length??0)||gear.some(id=>!u.equipmentIds?.includes(id));
   if(!skillChanged&&!gearChanged)continue;
   const next={...u,loadout:skillChanged?slots:u.loadout};
   if(gearChanged){
    // Use the same equipment stat rules as the camp, but don't refill or
    // clear use-once equipment state. An increased maximum isn't free HP/MP.
    C.applyHero(next,{...profile.heroes[u.cls],ranks:u.ranks,equipmentIds:gear},false,'equipment');
   }
   changes.push({u,next});
  }
  // Two different actors may select the same currently unassigned shared item.
  const equipped=actors.flatMap(u=>(changes.find(c=>c.u===u)?.next??u).equipmentIds??[]);
  return new Set(equipped).size===equipped.length?changes:null;
 }catch{return null;}
}
