// Reverse B first, then the immutable approved A forest/cavern authoring.
import {beforeCavernExpansion} from './cavern-expansion-history-helpers.mjs';
import {beforeForestCavernTopology} from './forest-cavern-history-helpers.mjs';
export function beforeApprovedTopology(project,options){return beforeForestCavernTopology(beforeCavernExpansion(project),options);}
