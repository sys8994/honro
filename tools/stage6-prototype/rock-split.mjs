/** Diagnostic alternative only; not imported into production. The artist may
 * replace removed silhouettes with clearly non-colliding background forms. */
import {floor} from './author.mjs';
export function splitLegacyRocks(input){const p=structuredClone(input),s=p.stages.find(v=>v.metadata?.stageId===6);if(!s)throw Error('Stage 6 missing');const ids=new Set(['place6-west-rock','place6-east-rock']);if(s.elements.filter(v=>ids.has(v.id)).length!==2)throw Error('Expected both legacy collision rocks');s.elements=s.elements.filter(v=>!ids.has(v.id));const deer=s.units.find(v=>v.id==='foe-6'),clone=s.design?.positioning?.clusterPositions?.['foe-6-cluster'];if(!deer||!clone)throw Error('Expected both legacy deer placements');deer.y=deer.spawnY=floor(deer.x);clone.y=floor(clone.x);return p;}
