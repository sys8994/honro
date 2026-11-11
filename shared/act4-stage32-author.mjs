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
export function authorAct4Stage32(stage) {
 if (!stage.units.some(u => u.id === 'a4-32-d-3' && u.kind === 'lantern')) throw Error('Stage32 lantern contract changed');
 return {...stage, design: {...stage.design, flightRegion: {...STAGE32_FLIGHT_REGION}}};
}
