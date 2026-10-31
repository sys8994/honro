import {readFile} from 'node:fs/promises';import {runtime} from '../../game/tests/helpers.mjs';
process.env.HONRO_ACT4_RELEASE='1';const g=await runtime({legacyMaps:false,productionStory:true});let bad=0;
for(let n=31;n<=40;n++){const p=JSON.parse(await readFile(`_local/act4-rc/candidates/stage${n}.json`));const rows=g.HonroMaps.validate(p).filter(x=>x.level==='err');console.log(JSON.stringify({stage:n,errors:rows}));if(rows.length)bad++;}
if(bad)process.exitCode=1;
