/** Diagnostic only: carve splinters into existing deck thickness, without
 * extending any walkable top edge or introducing another platform. */
import {connectedBridgeCandidate} from './connected-bridge.mjs';
export function brokenDeckEdges(input){const p=connectedBridgeCandidate(input),s=p.stages.find(v=>v.metadata?.stageId===6),w=s.terrains.find(v=>v.id==='bridge-west')?.points,m=s.terrains.find(v=>v.id==='bridge-mid')?.points,e=s.terrains.find(v=>v.id==='bridge-east')?.points;if(w?.length!==8||m?.length!==6||e?.length!==8)throw Error('Unexpected connected skeleton');w.splice(4,0,{x:2520,y:1930},{x:2526,y:1941},{x:2519,y:1952});m.splice(3,0,{x:3690,y:1890},{x:3696,y:1901},{x:3689,y:1912});e.push({x:4009,y:1915},{x:4004,y:1903},{x:4011,y:1893});return p;}
