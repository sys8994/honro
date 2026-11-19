// Candidate against master 1e043b09. Fresh authoring only, never patch live saves.
// Existing actor identities, kinds, stats, scripts, terrain and total are retained.
export const clusters = [
 {key:'stair-foot', reason:'Middle stair arrival: front guard and close escort, bow behind the turn.', members:[['b-1','middle-clearing',1805],['b-6','middle-clearing',1900],['b-2','middle-clearing',2125]]},
 {key:'bamboo-crossfire', reason:'Fallen bamboo crossing: binding support below, a bow and arc thrower on separate steps of the sloping bamboo.', members:[['b-5','middle-clearing',2455],['b-3','middle-clearing',2320],['b-4','fallen-bamboo',2845],['b-7','fallen-bamboo',2660]]},
 {key:'upper-west-reserve', reason:'Upper clearing western lip: detached ranged reserve, separated from the actual east stairhead.', members:[['d-3','upper-clearing',2875],['d-4','upper-clearing',3060],['d-5','upper-clearing',3385]]},
 {key:'upper-stairhead', reason:'Actual upper-stair junction near x3924: guard at the lip, close threats down the ascent instead of a row across the plateau.', members:[['d-1','upper-clearing',3910],['d-2','upper-stairs',3685],['e-2','upper-stairs',3470],['e-3','upper-clearing',4010]]},
 {key:'exit-watch', reason:'Exit approach: one forward guard, binding support behind, two separated bows. No kill-all condition added.', members:[['e-4','upper-clearing',4160],['e-1','upper-clearing',4280],['e-6','upper-clearing',4385],['e-7','upper-clearing',4490]]},
 {key:'ridge-lantern', reason:'Solitary lantern above the ascent approach, not a fifth actor in an exit row; retain existing flight behavior.', members:[['e-5','upper-clearing',3595]]},
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
