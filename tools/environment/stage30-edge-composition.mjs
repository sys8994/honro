/** Regenerate only the distant-channel asset, never geography or stage state. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {distantRiver} from './stage30-ferry-art.mjs';
export function applyStage30WaterEdge(project){const s=project.stages.find(s=>s.metadata?.stageId===30),asset=distantRiver(s);if(!project.library.some(a=>a.id===asset.id))throw Error('Missing existing distant channel');return {...project,library:project.library.map(a=>a.id===asset.id?asset:a)};}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=new URL('../../shared/data/campaign.json',import.meta.url),p=JSON.parse(await readFile(file,'utf8'));await writeFile(file,JSON.stringify(applyStage30WaterEdge(p))+'\n');}
