/** Only fresh Stage 9 opts into real warning opportunities. Keep the original
 * first-act spawn/tuning path, including production population doubling. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export function applyTacticalWaveWarnings(project){const p=structuredClone(project),s=p.stages.find(s=>s.metadata?.stageId===9&&s.metadata.campaign);if(!s)return p;s.initialState.honroEncounterDensityRevision=1;
 for(const [id,warning]of [['evac-beasts','대피로 뒤쪽에서 들린 짐승들이 다가옵니다. 다음 행동 동안 아래 길과 높은 마당의 사선을 살피세요.'],['evac-crows','윗마당에서 까마귀 떼가 내려옵니다. 다음 행동 동안 몸을 가릴 곳과 반대 길을 살피세요.']]){const e=s.events.find(e=>e.id===id);if(!e)throw Error('Missing existing evacuation wave '+id);e.honroTacticalWarning=1;e.warning=warning;}
 return p;}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[2]||'shared/data/campaign.json';await writeFile(file,JSON.stringify(applyTacticalWaveWarnings(JSON.parse(await readFile(file,'utf8'))),null,2)+'\n');}
