/** Place the existing guards where they can cover the two approaches. */
export function authorAct4Stage38(stage, supportPoint) {
 const ridgeGuard = 'a4-38-e-1';
 const rescueArcher = 'a4-38-f-1';
 const ascentGroup = 'a4-38-d';
 const formerGroup = 'a4-38-e';
 const ascent = stage.units.find(u => u.id === 'a4-38-d-1');
 if (!ascent || !stage.units.some(u => u.id === ridgeGuard) || !stage.units.some(u => u.id === rescueArcher)) {
  throw Error('Missing Stage 38 approach guards');
 }

 // The rising ridge exposes travelers before they reach the exit plateau.
 const ridge = supportPoint(stage, 'approved38-upper', 4530);
 // The old archer pose was inside the rock step. This ledge gives it a clear
 // shot toward the top of the step and leaves both pursuers' approach clear.
 const ledge = supportPoint(stage, 'approved38-rescue-ledge', 5060);
 const units = stage.units.map(unit => {
  if (unit.id === rescueArcher) return {...unit, ...ledge};
  if (unit.id !== ridgeGuard) return unit;
  return {...unit, ...ridge, encounterGroup: ascentGroup,
   stageOverrides: {...unit.stageOverrides, group: ascent.stageOverrides.group}};
 });
 const encounters = stage.encounters.map(group => {
  if (group.id === formerGroup) return {...group, unitIds: group.unitIds.filter(id => id !== ridgeGuard)};
  if (group.id === ascentGroup) return {...group, unitIds: [ridgeGuard, ...group.unitIds]};
  return group;
 });
 return {...stage, units, encounters};
}
