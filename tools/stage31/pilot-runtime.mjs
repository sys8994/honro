// The model-only test runtime omits App-only Act 4 modules. Load the same
// reference and pilot implementation used by the production App before a
// tagged stage is compiled; do not replace its combat behavior with a stub.
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
export async function loadPilotRuntime(g){
 if(g.HonroAct4PilotCombat){
  if(!g.HONRO_ACT4_PILOT_COMBAT_REFERENCE)throw Error('Pilot combat runtime exists without its production reference');
  return;
 }
 g.HONRO_ACT4_PILOT_COMBAT_REFERENCE=JSON.parse(await readFile('shared/data/act4/pilot-combat-reference.json','utf8'));
 vm.runInContext(await readFile('shared/runtime/act4-pilot-combat.js','utf8'),g);
 if(!g.HonroAct4PilotCombat)throw Error('Stage31 production pilot runtime failed to load');
}
