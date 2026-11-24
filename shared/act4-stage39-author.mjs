/** Place the existing net guard where residents actually cross the wreck deck. */
const sideLanes=[
 ['a4-39-w-1','approved39-west-middle',810,'approved39-west-middle',755],
 ['a4-39-w-2','approved39-west-middle',945,'approved39-west-gallery',1010],
 ['a4-39-w-4','approved39-west-middle',1215,'approved39-west-lower-stair',1515],
 ['a4-39-x-2','approved39-upper',5760,'approved39-east-upper-stair',5247],
];
export function authorAct4Stage39(stage,supportPoint){
 if(stage.metadata?.stageId!==39)return stage;
 const guard=stage.units.find(u=>u.id==='a4-39-n-1'&&u.team==='enemy');
 const moves=new Map();
 if(guard?.stageOverrides?.honroEncounterSupport==='approved39-east-deck'){
  const support='approved39-wreck-deck';
  const position=supportPoint(stage,support,4015);
  moves.set(guard,{...guard,...position,stageOverrides:{...guard.stageOverrides,honroEncounterSupport:support}});
 }
 if(stage.id==='stage-39'&&stage.metadata.campaign===true&&stage.metadata.act4Stage===39)for(const [id,from,x,to,nx] of sideLanes){
  const u=stage.units.find(v=>v.id===id&&v.team==='enemy'),o=u?.stageOverrides;
  if(!u||o.elite||o.honroMidboss||o.honroEncounterSupport!==from||u.x!==x||Math.abs(u.y-supportPoint(stage,from,x).y)>.01)throw Error('Stage 39 side-lane source changed: '+id);
  moves.set(u,{...u,...supportPoint(stage,to,nx),stageOverrides:{...o,honroEncounterSupport:to}});
 }
 return moves.size?{...stage,units:stage.units.map(u=>moves.get(u)||u)}:stage;
}
