// The harbour's one required flier is the door lantern. Left alone it climbed
// toward the top of the map (feet y118-530 in measured runs, ground y869) above
// the far shelter and stayed there as the last required enemy after the yard
// fight. Give the port a low sky so the same lantern, at its authored door
// post, stays within ordinary arcs. Uses the engine's existing authored flight
// region (Stage2 precedent). New battles only: a saved battle keeps its own
// compiled map. No unit, HP, count, terrain or win condition changes.
export const STAGE32_FLIGHT_REGION = Object.freeze({
 left: 0, right: 3379.2, top: 520, bottom: 2252.8,
 reason: 'Low harbour sky: the required door lantern stays within ordinary arcs of the yard and ramp.',
});
export const STAGE32_REMOVED_PROXY = 'approved32-upper-west-foundation';
export function authorAct4Stage32(stage) {
 if (!stage.units.some(u => u.id === 'a4-32-d-3' && u.kind === 'lantern')) throw Error('Stage32 lantern contract changed');
 // The store foundation was an invisible interior collision proxy. Its low
 // underside stopped the eastward walk along the lower lane at x849 (head
 // contact). It is not drawn and nothing stands on it (the entry road above is
 // its own walk strip), so new battles simply do not carry it.
 if (!stage.terrains.some(t => t.id === STAGE32_REMOVED_PROXY)) throw Error('Stage32 foundation proxy contract changed');
 return {...stage, terrains: stage.terrains.filter(t => t.id !== STAGE32_REMOVED_PROXY), design: {...stage.design, flightRegion: {...STAGE32_FLIGHT_REGION}}};
}
