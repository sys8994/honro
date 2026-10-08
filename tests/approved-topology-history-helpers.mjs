// Reverse the two exact D Act1 flags, then immutable approved B/A authoring.
import {beforeOpenAct1Structures} from './open-structure-history-helpers.mjs';
import {beforeCavernExpansion} from './cavern-expansion-history-helpers.mjs';
import {beforeForestCavernTopology} from './forest-cavern-history-helpers.mjs';
export function beforeApprovedTopology(project,{openStructures=true,...options}={}){return beforeForestCavernTopology(beforeCavernExpansion(openStructures?beforeOpenAct1Structures(project):project),options);}
