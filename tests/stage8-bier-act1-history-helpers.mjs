/** Opt-in input facade for pre-Stage8 Act1 geometry/aim/art contracts.
 * The shared act1Runtime remains current. No historical engine source runs;
 * only exact reviewed8 map/assets and count-derived semantic rows are reversed.
 * Do not use this facade as evidence of a current new8 normal playthrough. */
import assert from 'node:assert/strict';
import {act1Runtime as currentAct1Runtime} from './act1-spatial-test-helpers.mjs';
import {beforeStage8Bier,beforeStage8BierBalance,beforeStage8BierContent,beforeStage8BierRuntimeSources,beforeStage12QuarryBalance} from './stage8-bier-history-helpers.mjs';
export * from './act1-spatial-test-helpers.mjs';
import {beforeStage11RavineBalance} from './stage11-ravine-history-helpers.mjs';
// Reuse the approved Act2 balance composition: 8→23→12, then11→16/17.
// This is only the frozen all-act balance assertion input, not live Stage8 stats.
export function beforeAct1HistoricalBalance(balance){return beforeStage11RavineBalance(beforeStage12QuarryBalance(balance));}
export function useBeforeStage8Inputs(g,{review}={}){
 beforeStage8BierRuntimeSources(undefined,{review});
 const project=beforeStage8Bier(g.HONRO_PROJECT,{review}),balance=beforeStage8BierBalance(g.HONRO_BALANCE,{review}),content=beforeStage8BierContent(g.HONRO_CONTENT,{review});
 for(const key of ['HONRO_BALANCE','HONRO_CONTENT'])assert.equal(g[key].stages[7].id,8,'Original Stage8 semantic row order');
 // Preserve the live source objects and captured closures; replace only row8.
 g.HONRO_PROJECT=project;g.HONRO_BALANCE.stages[7]=balance.stages[7];g.HONRO_CONTENT.stages[7]=content.stages[7];return g;
}
export async function act1Runtime(){return useBeforeStage8Inputs(await currentAct1Runtime());}
