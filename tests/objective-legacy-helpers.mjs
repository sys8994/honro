import {readFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
export const legacyObjectiveMaps=JSON.parse(gunzipSync(await readFile(new URL('./fixtures/objective-legacy-maps.json.gz',import.meta.url))).toString('utf8'));
export function legacyObjectiveBattle(g,id,profile){const map=legacyObjectiveMaps.maps.find(s=>s.metadata.stageId===id);if(!map)throw Error('No historical objective map '+id);const assets=new Map(g.HONRO_PROJECT.library.map(a=>[a.id,a]));for(const a of legacyObjectiveMaps.library)assets.set(a.id,a);const project={...g.HONRO_PROJECT,library:[...assets.values()]};return g.HonroMaps.createBattle(map,project,profile,{origin:'campaign'});}
