/** Surgical fresh-entry corrections. Apply after chapter authors; only listed
 * unit poses and their existing encounter-site metadata change. Never replace
 * a whole chapter or project from a stale parallel checkout. */
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
export const CLEARANCE_PATCHES={
 11:[
  {id:'rv11-refuge-two-levels-0',x:9215,y:8761.69387755102,obstacle:'rv-root-arch'},
  {id:'rv11-east-stone-overwatch-7',x:11590,y:4784,obstacle:'rv-east-windswept-bough'},
  {id:'rv11-east-stone-overwatch-9',x:11690,y:4814,obstacle:'rv-east-windswept-bough'}
 ],
 13:[{id:'a2-enemy-7',x:3000,y:3352.5,obstacle:'forecourt-shot-ledge'}],
 15:[{id:'a2-enemy-11',x:5200,y:3900,obstacle:'fc15-safe-crown-descent'}],
 16:[{id:'a2-enemy-17',x:9140,y:4522.333333333333,obstacle:'tm-archive-walk'}],
 17:[{id:'ws-brace-bat',x:2845,y:3750,obstacle:'ws-west-switchback'}],
 18:[
  {id:'sb-a-bat-low',x:1640,y:5329.2307692307695,obstacle:'sb-west-upper-rise'},
  {id:'sb-a-air-screen',x:1720,y:5238.518518518518,obstacle:'sb-west-upper-rise'}
 ]
};
export function applyChapterClearancePatch(project,stageId){
 const rows=CLEARANCE_PATCHES[stageId];if(!rows)return project;
 const s=project.stages.find(s=>s.metadata?.stageId===stageId);if(!s)throw Error('Missing chapter '+stageId);
 for(const row of rows){const u=s.units.find(u=>u.id===row.id);if(!u)throw Error('Missing actor '+row.id);
  u.x=row.x;u.y=row.y;if(Object.hasOwn(u,'spawnX'))u.spawnX=row.x;if(Object.hasOwn(u,'spawnY'))u.spawnY=row.y;
  for(const site of s.design?.space?.encounterSites||[])if(site.unitId===row.id){site.x=row.x;site.y=row.y;}
 }return project;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const ids=process.argv.slice(2).map(Number);if(!ids.length||ids.some(id=>!CLEARANCE_PATCHES[id]))throw Error('Pass explicit owned chapter IDs');
 const file='shared/data/campaign.json',p=JSON.parse(await readFile(file,'utf8'));
 for(const id of ids)applyChapterClearancePatch(p,id);await writeFile(file,JSON.stringify(p)+'\n');console.log('Patched chapter poses only:',ids.join(','));
}
