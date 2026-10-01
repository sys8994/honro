import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=new URL('../../shared/map/environment.js',import.meta.url);
const file=new URL('../../shared/data/campaign.json',import.meta.url);
const context=vm.createContext({});
vm.runInContext(await readFile(source,'utf8'),context);
const E=context.HonroEnvironment,original=await readFile(file,'utf8'),project=JSON.parse(original);
const gameplay=JSON.stringify(project.stages.map(({environment,...stage})=>stage));
for(const stage of project.stages)if(stage.environment)stage.environment.version=E.VERSION-1;
E.upgradeComposition(project);
for(const sourceAsset of E.generatedAssets()){
 const asset=project.library.find(a=>a.id===sourceAsset.id);
 Object.assign(asset,{visual:sourceAsset.visual,reference:sourceAsset.reference});
}
if(JSON.stringify(project.stages.map(({environment,...stage})=>stage))!==gameplay)throw Error('Environment regeneration changed gameplay data');
const issues=E.validate(project);
if(issues.length)throw Error(JSON.stringify(issues.slice(0,12)));
const output=JSON.stringify(project,null,2)+'\n';
if(output!==original)await writeFile(file,output);
console.log(`${output===original?'Checked':'Regenerated'} fixed-world scenery on ${project.stages.length} maps; all gameplay fields preserved`);
