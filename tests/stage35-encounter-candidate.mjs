// Candidate against master 1e043b09. Fresh authoring only, never patch live saves.
// Existing actor identities, kinds, stats, scripts, terrain and total are retained.
export const clusters = [
 {key:'stair-foot', reason:'Arrival turn: guard and mourner at the stair lip; final-runtime ghost by the stone pile.', members:[['b-1','middle-clearing',1805],['b-6','middle-clearing',1900],['b-2','middle-clearing',2125]]},
 {key:'bamboo-crossing', reason:'Bamboo rise: shade controls crossing, crow overhead, warden on lower slope and named geuseundae at its upper end.', members:[['b-5','middle-clearing',2455],['b-3','middle-clearing',2320],['b-4','fallen-bamboo',2845],['b-7','fallen-bamboo',2660]]},
 {key:'ruin-sentry', reason:'Upper western ruin: named marksman with shade cover and a crow over the approach, not a plateau-wide row.', members:[['d-3','upper-clearing',2875],['d-4','upper-clearing',3060],['e-6','upper-clearing',3235]]},
 {key:'bridge-watch', reason:'Bamboo-span junction: lantern over the crossing, mourner at its eastern landing guarding the route to the existing side commander.', members:[['d-5','bamboo-span',3190],['e-3','bamboo-span',3375]]},
 {key:'stair-approach', reason:'Upper ascent lower elbow: binding shade at its foot and named yagwanggwi partway up the climb.', members:[['e-1','upper-stairs',3280],['e-2','upper-stairs',3490]]},
 {key:'stairhead', reason:'Upper ascent top: mourner below the final turn and guard at the landing.', members:[['d-2','upper-stairs',3755],['d-1','upper-stairs',3880]]},
 {key:'exit-sentry', reason:'Only two grounded sentries at the final exit: guard then ghost. Other pressure is assigned to distinct bridge, ruin and stair junctions.', members:[['e-4','upper-clearing',4275],['e-7','upper-clearing',4450]]},
 {key:'ridge-lantern', reason:'Solitary existing lantern over the upper landing; preserves flight semantics.', members:[['e-5','upper-clearing',3800]]},
];
export function authorAct4Stage35Encounter(stage, supportPoint) {
 if(stage.metadata?.stageId!==35)return stage;
 const moves=new Map();
 for(const [i,c]of clusters.entries())for(const [short,support,x]of c.members){
  const id='a4-35-'+short,unit=stage.units.find(u=>u.id===id&&u.team==='enemy');
  if(!unit||moves.has(id))throw Error('Stage35 encounter contract changed: '+id);
  moves.set(id,{point:supportPoint(stage,'approved35-'+support,x),support:'approved35-'+support,key:'a4-35-authored-'+c.key,group:110+i});
 }
 const units=stage.units.map(u=>{const m=moves.get(u.id);return m?{...u,...m.point,encounterGroup:m.key,stageOverrides:{...u.stageOverrides,group:m.group,honroEncounterSupport:m.support}}:u;});
 const encounters=stage.encounters.map(e=>({...e,unitIds:e.unitIds.filter(id=>!moves.has(id))})).filter(e=>e.unitIds.length);
 for(const c of clusters)encounters.push({id:'a4-35-authored-'+c.key,key:'a4-35-authored-'+c.key,behavior:'guard',unitIds:c.members.map(([id])=>'a4-35-'+id)});
 return {...stage,units,encounters};
}
