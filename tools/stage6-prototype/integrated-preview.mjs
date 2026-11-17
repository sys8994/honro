/** 37th art + existing broken-deck/small-rock candidate. Unshipped QA only.
 * The art author has already applied the valley exactly once; do not call it
 * again here. This preserves all other stages, objectives and event contracts.
 */
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {brokenDeckEdges} from './broken-deck-edges.mjs';
import {addRockContactShadow} from './contact-shadow-preview.mjs';
import {addDeckFractures} from './deck-fractures-preview.mjs';
const expected={
 // Registration-only Stage6 bounds expansion; reviewed vector and stage hashes
 // remain locked by tests/stage6-art-bounds.mjs. Do not relax the source guard.
 'art-preview.mjs':'fafc24f79e8d9f1d5bae805d7b4460e446b07ffcfb0bb54aa85e0e18f343620a',
 'author.mjs':'1c3f1f1825e39cabf653688ed779dcc42d80ce448e4e582173a8eb53cbb80870',
 'broken-deck-edges.mjs':'1917c02d729ee55002e92c4d7c246a499fde56c6b0ed329f479931d4d21a5ca2'
};
export function applyStage6IntegratedPreview(input){
 for(const [name,hash]of Object.entries(expected))if(createHash('sha256').update(readFileSync(new URL(name,import.meta.url))).digest('hex')!==hash)throw Error('Stage6 fixed integration source changed: '+name);
 const s=input.stages.find(x=>x.metadata?.stageId===6);
 if(!s?.elements.some(x=>x.id==='stage06-prototype-body')||s.elements.some(x=>x.id==='stage06-prototype-deck-fracture-study'))throw Error('Apply Stage6 art once, then integration once');
 return addDeckFractures(addRockContactShadow(brokenDeckEdges(input)));
}
