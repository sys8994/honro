import {loadNarrativeData} from '../story/load-data.mjs';
/** Apply only the approved objective delta; do not regenerate map geometry. */
import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
export async function applyObjectiveRevision(project,{force=true}={}){
 const balance=JSON.parse(await readFile('game/config/balance.json','utf8'));
 const g=vm.createContext({HONRO_CORE:{SKILLS:{}},HONRO_BALANCE:balance,HonroWorld:{archetypes:{}}});
 await loadNarrativeData(g,process.cwd());
 for(const name of ['narrative-catalogue','content','story-content-v1','story-content','act2-content','act3-content','objective-revision'])vm.runInContext(await readFile('shared/runtime/'+name+'.js','utf8'),g);
 return JSON.parse(JSON.stringify(g.HonroObjectiveRevision.author(project,{force})));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const file='shared/data/campaign.json',before=JSON.parse(await readFile(file,'utf8')),after=await applyObjectiveRevision(before),max=Number(process.argv.find(a=>a.startsWith('--max-stage='))?.split('=')[1]||30);
 after.stages=after.stages.map((s,i)=>s.metadata.stageId<=max?s:before.stages[i]);
 await writeFile(file,JSON.stringify(after,null,2)+'\n');
 console.log('Applied objective revision through stage '+max+'; unrelated art and unit rosters preserved.');
}
