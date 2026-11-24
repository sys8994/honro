// Existing HONRO rigs and tactics. Only exact Stage53 authored roster rows.
export function stage53EchoRole(world,old,id){
 const spec={
  'draft-lower-lane-guard':['ghost','바닥을 더듬는 잔향',290,35,'낮은 길을 훑는 상여그늘'],
  'draft-upper-side-guard':['shade','문지방의 매듭귀',520,0,'고정 범위를 예고하는 매듭실']
 }[id]; if(!spec)return null;
 const [kind,name,hp,walk,intent]=spec;
 const a=world.archetypes[kind];
 return {...old,cls:a.cls,name,role:a.role,hp,maxHp:hp,attack:a.attack,walkSpeed:walk,maxMove:walk,moveLeft:walk,
  loadout:kind==='shade'?['HSH02']:a.skills.slice(),ranks:Object.fromEntries(a.skills.map(s=>[s,1])),intent,...(kind==='shade'?{honroMonsterEffectSkill:'HSH02'}:{}),honroType:kind,honroVariant:a.look};
}
