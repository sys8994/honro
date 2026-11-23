// Authored encounter staging for the official Act 4 maps, after the legacy
// author pass. Only these existing units are moved; gameplay state and stage
// scenery are not rebuilt or copied. x and y use registered walk edges.
const placements = {
 31: [
  // Dike low fork: a covering bow stands further round the bend with a guard
  // closer to the bind point. The upper bridge guard stays put.
  ['pilot31-west-crossfire-2', 'approved31-low-flank', 2227.5, 2340],
  ['pilot31-west-crossfire-7', 'approved31-low-flank', 2452.5, 2530],
  ['pilot31-west-crossfire-5', 'approved31-low-flank', 2677.5, 2820],
  ['pilot31-lookout-return-2', 'approved31-low-flank', 4635, 4710],
  ['pilot31-lookout-return-5', 'approved31-low-flank', 4837.5, 4900],
 ],
 35: [
  // Lower path: an approach guard and the first stair ambush are different
  // contacts; the hound cutoff sits beyond the open first clearing.
  ['a4-35-a-1', 'approved35-first-clearing', 1230, 1200],
  ['a4-35-a-2', 'approved35-first-clearing', 1365, 1508, 'approved35-first-ascent'],
  ['a4-35-a-3', 'approved35-first-clearing', 1500, 1546],
  ['a4-35-k-2', 'approved35-first-clearing', 2115, 2228],
  ['a4-35-k-3', 'approved35-first-clearing', 2295, 2398],
  // The middle stairs have a pursuable body; archers cover two different
  // ends of the clearing without planting anyone on the blocked-shot bridge.
  ['a4-35-b-1', 'approved35-middle-clearing', 1830, 1778],
  ['a4-35-b-4', 'approved35-middle-clearing', 2190, 2410],
  ['a4-35-b-5', 'approved35-middle-clearing', 2310, 2220],
  ['a4-35-b-6', 'approved35-middle-clearing', 2430, 1510, 'approved35-middle-stairs'],
  // Upper shelf: western ambush, inner firing point, and staggered exit
  // approach. The hound watches the lower turn rather than filling that line.
  ['a4-35-d-1', 'approved35-upper-clearing', 2880, 2810],
  ['a4-35-d-2', 'approved35-upper-clearing', 3030, 2964],
  ['a4-35-d-3', 'approved35-upper-clearing', 3180, 3285],
  ['a4-35-d-4', 'approved35-upper-clearing', 3330, 3405],
  ['a4-35-d-5', 'approved35-upper-clearing', 3480, 3550],
  ['a4-35-e-2', 'approved35-upper-clearing', 3810, 3470, 'approved35-upper-stairs'],
  ['a4-35-e-3', 'approved35-upper-clearing', 3930, 3800],
  ['a4-35-e-7', 'approved35-upper-clearing', 4410, 4372],
 ],
 37: [
  // Break up the low road file; the west-facing bow and melee watcher bank
  // the bypass while the guard and binder remain near the eastern turn.
  ['a4-37-b-3', 'approved37-lower-road', 1600, 1520],
  ['a4-37-b-4', 'approved37-lower-road', 1472, 575],
  ['a4-37-b-5', 'approved37-lower-road', 1344, 880],
  // Curves of the middle switchback now carry two different contacts rather
  // than six evenly spaced silhouettes; the vanguard's ID/anchor stays put.
  ['a4-37-c-1', 'approved37-middle-road', 1520, 1700],
  // Preserve the stock engine's actual grounded post-separation vanguard
  // anchor. Its former middle-road author seed required fallback there.
  ['a4-37-c-3', 'approved37-middle-road', 1296, 1072, 'approved37-lower-road'],
  ['a4-37-c-6', 'approved37-middle-road', 928, 541],
  ['a4-37-d-1', 'approved37-hoist-deck', 1648, 405, 'approved37-lower-road'],
  // Separate the first upper turn, crane lower landing and signal approach.
  // The first two guards on the turn no longer occupy the same ground pocket.
  ['a4-37-e-1', 'approved37-upper-road', 1120, 1095],
  ['a4-37-e-2', 'approved37-upper-road', 1136, 963],
  ['a4-37-h-1', 'approved37-upper-road', 1530, 1180, 'approved37-entry'],
  ['a4-37-h-2', 'approved37-upper-road', 1728, 1492],
  ['a4-37-h-3', 'approved37-upper-road', 1856, 1825],
  ['a4-37-h-5', 'approved37-upper-road', 2144, 2090],
  ['a4-37-h-6', 'approved37-upper-road', 2272, 2178],
 ],
};

export function applyAct4P0Placement(stage, supportPoint) {
 const n=stage.metadata?.stageId;
 if(stage.metadata?.campaign!==true||stage.metadata?.act4Stage!==n||!Object.hasOwn(placements,n))return stage;
 const rows=new Map(placements[n].map(row=>[row[0],row]));
 const units=stage.units.map(unit=>{
  const row=rows.get(unit.id);
  if(!row)return unit;
  const [id,oldSupport,oldX,x,support=oldSupport]=row;
  if(unit.team!=='enemy'||unit.x!==oldX||unit.stageOverrides?.honroEncounterSupport!==oldSupport)
   throw Error('Act4 placement source changed: '+id);
  const point=supportPoint(stage,support,x);
  rows.delete(id);
  return {...unit,...point,stageOverrides:{...unit.stageOverrides,honroEncounterSupport:support}};
 });
 if(rows.size)throw Error('Missing Act4 placement IDs: '+[...rows.keys()].join(', '));
 return {...stage,units};
}
