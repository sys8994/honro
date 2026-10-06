import {readFile,writeFile} from 'node:fs/promises';
import {runtime} from '../../game/tests/helpers.mjs';
const g=await runtime({legacyMaps:false}),file='shared/data/campaign.json',source=JSON.parse(await readFile(file,'utf8')),project=g.HonroTerrainDomain.author(source);
const errors=g.HonroMaps.validate(project).filter(v=>v.level==='err');if(errors.length)throw Error(JSON.stringify(errors));
await writeFile(file,JSON.stringify(project,null,2)+'\n');console.log('Authored one continuous terrain domain with independent playBounds for',project.stages.length,'stages');
