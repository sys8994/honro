/** Art-only fresh-map overlay. Never rerun the historical objective author. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {applyStage23YardArt} from '../environment/stage23-yard-art.mjs';
export async function applyStage23Refinement(project){
 const p=structuredClone(project),s=p.stages.find(s=>s.metadata.stageId===23),elements=s.elements.filter(e=>!e.id.startsWith('sy-art-')),environment=structuredClone(s.environment);
 await applyStage23YardArt(p);
 // Keep later story set dressing and environment contracts as authored.
 s.environment=environment;
 if(!elements.every(e=>s.elements.some(v=>JSON.stringify(v)===JSON.stringify(e))))throw Error('Story set dressing lost');
 return p;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const f='shared/data/campaign.json';await writeFile(f,JSON.stringify(await applyStage23Refinement(JSON.parse(await readFile(f,'utf8'))),null,2)+'\n');}
