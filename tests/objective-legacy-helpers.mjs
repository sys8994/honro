import {splitV1Profile} from './split-v1-test-helpers.mjs';
import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
export const legacyObjectiveMaps=JSON.parse(gunzipSync(await readFile(new URL('./fixtures/objective-legacy-maps.json.gz',import.meta.url))).toString('utf8'));
const legacyDelta=JSON.parse(await readFile(new URL('./fixtures/objective-revision-delta.json',import.meta.url),'utf8'));
export function legacyObjectiveBattle(g,id,profile){const stored=legacyObjectiveMaps.maps.find(s=>s.metadata.stageId===id),map=stored&&structuredClone(stored);const steps=legacyDelta.changes.find(q=>q.id===id)?.steps?.before;if(map&&steps)map.initialState.honroAct3Steps=structuredClone(steps);if(!map)throw Error('No historical objective map '+id);const assets=new Map(g.HONRO_PROJECT.library.map(a=>[a.id,a]));for(const a of legacyObjectiveMaps.library)assets.set(a.id,a);const project={...g.HONRO_PROJECT,library:[...assets.values()]};const historical=splitV1Profile(g,map);if(profile)Object.assign(historical,structuredClone(profile),{honroSplitCampaign:historical.honroSplitCampaign});return g.HonroMaps.createBattle(map,project,historical,{origin:'campaign'});}
