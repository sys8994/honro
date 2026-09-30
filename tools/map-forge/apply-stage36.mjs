import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {runtime} from '../../game/tests/helpers.mjs';
import {migrate} from '../../migration/migrate-stages.mjs';

const source=new URL('../../shared/data/campaign.json',import.meta.url);
const recipe=new URL('../../workshop/recipes/stage36-place-design.js',import.meta.url);
const g=await runtime({legacyMaps:false});
vm.runInContext(await readFile(new URL('../../workshop/recipes/stage12-forest-basin.js',import.meta.url),'utf8'),g);
vm.runInContext(await readFile(recipe,'utf8'),g);
const migrated=await migrate();
const original=g.HonroCommands.apply(migrated,g.HonroStage12Design.commands(migrated));
const commands=g.HonroStage36Places.commands(original);
const result=g.HonroCommands.apply(original,commands);
if(process.argv.includes('--check')){
 const actual=JSON.parse(await readFile(source,'utf8'));
 if(JSON.stringify(result)!==JSON.stringify(actual))throw Error('Stage 3–6 recipe does not reproduce campaign.json');
 console.log('Stage 3–6 canonical data matches the recipe');
}else{
 await writeFile(source,JSON.stringify(result,null,2)+'\n');
 console.log(`Applied ${commands.length} Stage 3–6 Workshop commands`);
}
