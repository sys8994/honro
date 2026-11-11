// The west end of each climbing path is exposed while the party regroups.
// Put existing guards at those turns, with the bows further up the same road.
export function authorAct4Stage37(stage, supportPoint) {
 const positions = new Map([
  ['a4-37-a-1', ['approved37-lower-diagonal', 1180]],
  ['a4-37-a-2', ['approved37-lower-diagonal', 1430]],
  ['a4-37-a-3', ['approved37-lower-diagonal', 1315]],
  ['a4-37-b-1', ['approved37-lower-diagonal', 1585]],
  ['a4-37-e-1', ['approved37-upper-road', 1120]],
  ['a4-37-h-1', ['approved37-upper-road', 1530]],
 ]);
 return {
  ...stage,
  units: stage.units.map(unit => {
   const position = positions.get(unit.id);
   if (!position) return unit;
   const [support, x] = position;
   return {
    ...unit,
    ...supportPoint(stage, support, x),
    stageOverrides: {...unit.stageOverrides, honroEncounterSupport: support},
   };
  }),
 };
}
